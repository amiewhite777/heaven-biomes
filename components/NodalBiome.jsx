'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const biomes = {
  cosmic: {
    name: 'Cosmic Flow',
    background: 0x0a0a1a,
    nodeColor: 0x88ccff,
    nodeEmissive: 0x4488ff,
    edgeColor: 0xaaddff,
    particleColor: 0xffffcc,
    fogColor: 0x0a0a1a,
  },
  infernal: {
    name: 'Infernal Grid',
    background: 0x1a0808,
    nodeColor: 0xff4422,
    nodeEmissive: 0xff2200,
    edgeColor: 0x331111,
    particleColor: 0xff6644,
    fogColor: 0x1a0808,
  },
  diamond: {
    name: 'Diamond Web',
    background: 0x050510,
    nodeColor: 0xffffff,
    nodeEmissive: 0x8888ff,
    edgeColor: 0x4466aa,
    particleColor: 0xffffff,
    fogColor: 0x050510,
  },
  ethereal: {
    name: 'Ethereal Nebula',
    background: 0x0f0f2a,
    nodeColor: 0xffaaff,
    nodeEmissive: 0xaa66ff,
    edgeColor: 0x88aaff,
    particleColor: 0xffffaa,
    fogColor: 0x0f0f2a,
  },
}

export default function NodalBiome() {
  const containerRef = useRef(null)
  const [currentBiome, setCurrentBiome] = useState('cosmic')
  const [isRotating, setIsRotating] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight
    const biome = biomes[currentBiome]

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(biome.background)
    scene.fog = new THREE.FogExp2(biome.fogColor, 0.015)

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.z = 50

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(biome.nodeEmissive, 2, 100)
    pointLight1.position.set(20, 20, 20)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(biome.nodeEmissive, 1, 100)
    pointLight2.position.set(-20, -20, -20)
    scene.add(pointLight2)

    const nodes = []
    const nodeGroup = new THREE.Group()
    const nodeCount = 25

    for (let i = 0; i < nodeCount; i++) {
      const size = 0.5 + Math.random() * 1.5
      const geometry = currentBiome === 'diamond' 
        ? new THREE.OctahedronGeometry(size, 0)
        : new THREE.SphereGeometry(size, 32, 32)
      
      const material = new THREE.MeshStandardMaterial({
        color: biome.nodeColor,
        emissive: biome.nodeEmissive,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2,
      })

      const node = new THREE.Mesh(geometry, material)
      node.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
      )
      node.userData = { 
        originalPos: node.position.clone(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5
      }
      
      nodes.push(node)
      nodeGroup.add(node)

      const glowGeometry = new THREE.SphereGeometry(size * 1.5, 16, 16)
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: biome.nodeEmissive,
        transparent: true,
        opacity: 0.15,
      })
      const glow = new THREE.Mesh(glowGeometry, glowMaterial)
      node.add(glow)
    }
    scene.add(nodeGroup)

    const edgeGroup = new THREE.Group()
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: biome.edgeColor,
      transparent: true,
      opacity: 0.4,
    })

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = nodes[i].position.distanceTo(nodes[j].position)
        if (dist < 25) {
          const geometry = new THREE.BufferGeometry().setFromPoints([
            nodes[i].position,
            nodes[j].position
          ])
          const line = new THREE.Line(geometry, edgeMaterial)
          line.userData = { nodeA: i, nodeB: j }
          edgeGroup.add(line)
        }
      }
    }
    scene.add(edgeGroup)

    const particleCount = 200
    const particleGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100
      positions[i + 1] = (Math.random() - 0.5) * 100
      positions[i + 2] = (Math.random() - 0.5) * 100
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMaterial = new THREE.PointsMaterial({
      color: biome.particleColor,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
    })
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    let isDragging = false
    let previousMousePosition = { x: 0, y: 0 }
    let targetRotationX = 0
    let targetRotationY = 0

    const onMouseDown = (e) => {
      isDragging = true
      previousMousePosition = { x: e.clientX, y: e.clientY }
    }

    const onMouseMove = (e) => {
      if (!isDragging) return
      const deltaX = e.clientX - previousMousePosition.x
      const deltaY = e.clientY - previousMousePosition.y
      targetRotationY += deltaX * 0.005
      targetRotationX += deltaY * 0.005
      previousMousePosition = { x: e.clientX, y: e.clientY }
    }

    const onMouseUp = () => { isDragging = false }

    const onTouchStart = (e) => {
      isDragging = true
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }

    const onTouchMove = (e) => {
      if (!isDragging) return
      const deltaX = e.touches[0].clientX - previousMousePosition.x
      const deltaY = e.touches[0].clientY - previousMousePosition.y
      targetRotationY += deltaX * 0.005
      targetRotationX += deltaY * 0.005
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }

    const onWheel = (e) => {
      camera.position.z = Math.max(20, Math.min(100, camera.position.z + e.deltaY * 0.05))
    }

    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('mouseleave', onMouseUp)
    renderer.domElement.addEventListener('touchstart', onTouchStart)
    renderer.domElement.addEventListener('touchmove', onTouchMove)
    renderer.domElement.addEventListener('touchend', onMouseUp)
    renderer.domElement.addEventListener('wheel', onWheel)

    let animationId
    const clock = new THREE.Clock()
    let autoRotate = isRotating

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const time = clock.getElapsedTime()

      if (autoRotate && !isDragging) {
        targetRotationY += 0.002
      }

      nodeGroup.rotation.x += (targetRotationX - nodeGroup.rotation.x) * 0.05
      nodeGroup.rotation.y += (targetRotationY - nodeGroup.rotation.y) * 0.05
      edgeGroup.rotation.x = nodeGroup.rotation.x
      edgeGroup.rotation.y = nodeGroup.rotation.y

      nodes.forEach((node) => {
        const { originalPos, phase, speed } = node.userData
        node.position.y = originalPos.y + Math.sin(time * speed + phase) * 0.5
        node.position.x = originalPos.x + Math.cos(time * speed * 0.7 + phase) * 0.3
      })

      edgeGroup.children.forEach((line) => {
        const { nodeA, nodeB } = line.userData
        const positions = line.geometry.attributes.position.array
        positions[0] = nodes[nodeA].position.x
        positions[1] = nodes[nodeA].position.y
        positions[2] = nodes[nodeA].position.z
        positions[3] = nodes[nodeB].position.x
        positions[4] = nodes[nodeB].position.y
        positions[5] = nodes[nodeB].position.z
        line.geometry.attributes.position.needsUpdate = true
      })

      particles.rotation.y = time * 0.02
      particles.rotation.x = time * 0.01
      pointLight1.intensity = 2 + Math.sin(time * 2) * 0.5

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('mouseup', onMouseUp)
      renderer.domElement.removeEventListener('mouseleave', onMouseUp)
      renderer.domElement.removeEventListener('touchstart', onTouchStart)
      renderer.domElement.removeEventListener('touchmove', onTouchMove)
      renderer.domElement.removeEventListener('touchend', onMouseUp)
      renderer.domElement.removeEventListener('wheel', onWheel)
      container.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [currentBiome, isRotating])

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <h2 className="text-white text-xs font-medium tracking-widest opacity-70">BESPOKE BIOME</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(biomes).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setCurrentBiome(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  currentBiome === key
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {value.name}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setIsRotating(!isRotating)}
          className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2 text-white text-xs hover:bg-black/70 transition-all w-fit border border-white/10"
        >
          {isRotating ? '⏸ Pause' : '▶ Play'} Rotation
        </button>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <div className="text-white/30 text-sm tracking-widest font-light">HEAVEN</div>
      </div>
      <div className="absolute bottom-4 left-4 z-10 text-white/40 text-xs">
        Drag to rotate • Scroll to zoom
      </div>
      <div ref={containerRef} className="flex-1 cursor-grab active:cursor-grabbing" />
    </div>
  )
}