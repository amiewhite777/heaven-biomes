'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const biomes = {
  cosmic: {
    name: 'Cosmic Flow',
    image: '/cosmic.jpg',
    nodeCore: 0xffffff,
    nodeGlow: 0x88ddff,
    nodeOuter: 0x4488cc,
    ribbonColor: 0xcceeFF,
    ribbonGold: 0xffeecc,
  },
  infernal: {
    name: 'Infernal Grid',
    image: '/infernal.jpg',
    nodeCore: 0xffeeee,
    nodeGlow: 0xff6644,
    nodeOuter: 0xcc3322,
    ribbonColor: 0x442222,
    ribbonGold: 0xff4422,
  },
  diamond: {
    name: 'Diamond Web',
    image: '/diamond.jpg',
    nodeCore: 0xffffff,
    nodeGlow: 0xaaccff,
    nodeOuter: 0x6688cc,
    ribbonColor: 0x8899bb,
    ribbonGold: 0xffffff,
  },
  ethereal: {
    name: 'Ethereal Nebula',
    image: '/ethereal.jpg',
    nodeCore: 0xffffff,
    nodeGlow: 0xffaaff,
    nodeOuter: 0xaa66dd,
    ribbonColor: 0xaabbff,
    ribbonGold: 0xffffaa,
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

    // Scene
    const scene = new THREE.Scene()

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.z = 55

    // Renderer with better quality
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Load background image
    const textureLoader = new THREE.TextureLoader()
    textureLoader.load(biome.image, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      scene.background = texture
    }, undefined, () => {
      // Fallback gradient if image doesn't load
      scene.background = new THREE.Color(0x0a1628)
    })

    // Main group for rotation
    const mainGroup = new THREE.Group()
    scene.add(mainGroup)

    // Create luminous node with multiple glow layers
    const createNode = (size, position) => {
      const nodeGroup = new THREE.Group()
      nodeGroup.position.copy(position)

      // Bright core
      const coreGeom = new THREE.SphereGeometry(size * 0.4, 32, 32)
      const coreMat = new THREE.MeshBasicMaterial({
        color: biome.nodeCore,
        transparent: true,
        opacity: 1,
      })
      const core = new THREE.Mesh(coreGeom, coreMat)
      nodeGroup.add(core)

      // Inner glow
      const innerGlowGeom = new THREE.SphereGeometry(size * 0.7, 32, 32)
      const innerGlowMat = new THREE.MeshBasicMaterial({
        color: biome.nodeGlow,
        transparent: true,
        opacity: 0.6,
      })
      const innerGlow = new THREE.Mesh(innerGlowGeom, innerGlowMat)
      nodeGroup.add(innerGlow)

      // Outer glow
      const outerGlowGeom = new THREE.SphereGeometry(size, 32, 32)
      const outerGlowMat = new THREE.MeshBasicMaterial({
        color: biome.nodeOuter,
        transparent: true,
        opacity: 0.3,
      })
      const outerGlow = new THREE.Mesh(outerGlowGeom, outerGlowMat)
      nodeGroup.add(outerGlow)

      // Soft halo
      const haloGeom = new THREE.SphereGeometry(size * 1.8, 32, 32)
      const haloMat = new THREE.MeshBasicMaterial({
        color: biome.nodeGlow,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
      })
      const halo = new THREE.Mesh(haloGeom, haloMat)
      nodeGroup.add(halo)

      nodeGroup.userData = {
        originalPos: position.clone(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.3,
        size: size,
      }

      return nodeGroup
    }

    // Create flowing ribbon connection between two points
    const createRibbon = (startPos, endPos, isGold = false) => {
      // Create curved path
      const midPoint = new THREE.Vector3()
        .addVectors(startPos, endPos)
        .multiplyScalar(0.5)
      
      // Add some curve offset
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 5
      )
      midPoint.add(offset)

      const curve = new THREE.CatmullRomCurve3([
        startPos.clone(),
        midPoint,
        endPos.clone(),
      ])

      // Create tube geometry for ribbon effect
      const tubeGeom = new THREE.TubeGeometry(curve, 32, 0.15, 8, false)
      const tubeMat = new THREE.MeshBasicMaterial({
        color: isGold ? biome.ribbonGold : biome.ribbonColor,
        transparent: true,
        opacity: isGold ? 0.5 : 0.35,
        depthWrite: false,
      })
      const tube = new THREE.Mesh(tubeGeom, tubeMat)

      // Add a second thinner brighter ribbon inside
      const innerTubeGeom = new THREE.TubeGeometry(curve, 32, 0.05, 8, false)
      const innerTubeMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      })
      const innerTube = new THREE.Mesh(innerTubeGeom, innerTubeMat)

      const ribbonGroup = new THREE.Group()
      ribbonGroup.add(tube)
      ribbonGroup.add(innerTube)

      ribbonGroup.userData = { curve, startPos, endPos }

      return ribbonGroup
    }

    // Create nodes
    const nodes = []
    const nodePositions = [
      new THREE.Vector3(-25, 8, 0),
      new THREE.Vector3(-18, -5, 5),
      new THREE.Vector3(-10, 12, -5),
      new THREE.Vector3(-8, -8, 8),
      new THREE.Vector3(-2, 5, 0),
      new THREE.Vector3(5, -3, 5),
      new THREE.Vector3(8, 10, -3),
      new THREE.Vector3(12, -6, 0),
      new THREE.Vector3(18, 8, 5),
      new THREE.Vector3(22, -2, -5),
      new THREE.Vector3(28, 5, 3),
      new THREE.Vector3(-15, 0, -8),
      new THREE.Vector3(0, -10, -5),
      new THREE.Vector3(15, 0, -10),
    ]

    nodePositions.forEach((pos, i) => {
      const size = 1.5 + Math.random() * 2
      const node = createNode(size, pos)
      nodes.push(node)
      mainGroup.add(node)
    })

    // Create ribbon connections
    const ribbons = []
    const connections = [
      [0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 6],
      [3, 5], [4, 5], [4, 6], [5, 7], [6, 8], [7, 9],
      [8, 9], [8, 10], [9, 10], [11, 0], [11, 1], [11, 2],
      [12, 3], [12, 5], [12, 7], [13, 9], [13, 10], [4, 7],
    ]

    connections.forEach(([a, b], i) => {
      const isGold = i % 4 === 0 // Some ribbons are gold-tinted
      const ribbon = createRibbon(
        nodePositions[a],
        nodePositions[b],
        isGold
      )
      ribbons.push({ ribbon, nodeA: a, nodeB: b })
      mainGroup.add(ribbon)
    })

    // Add floating particles/stars
    const particlesGeom = new THREE.BufferGeometry()
    const particleCount = 300
    const positions = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60
      sizes[i] = Math.random() * 2
    }

    particlesGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particlesGeom.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const particlesMat = new THREE.PointsMaterial({
      color: 0xffffee,
      size: 0.3,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      sizeAttenuation: true,
    })

    const particles = new THREE.Points(particlesGeom, particlesMat)
    scene.add(particles)

    // Interaction
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
      camera.position.z = Math.max(30, Math.min(100, camera.position.z + e.deltaY * 0.05))
    }

    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('mouseleave', onMouseUp)
    renderer.domElement.addEventListener('touchstart', onTouchStart)
    renderer.domElement.addEventListener('touchmove', onTouchMove)
    renderer.domElement.addEventListener('touchend', onMouseUp)
    renderer.domElement.addEventListener('wheel', onWheel)

    // Animation
    let animationId
    const clock = new THREE.Clock()

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const time = clock.getElapsedTime()

      // Auto rotation
      if (isRotating && !isDragging) {
        targetRotationY += 0.001
      }

      // Smooth rotation
      mainGroup.rotation.x += (targetRotationX - mainGroup.rotation.x) * 0.03
      mainGroup.rotation.y += (targetRotationY - mainGroup.rotation.y) * 0.03

      // Animate nodes (gentle floating)
      nodes.forEach((node) => {
        const { originalPos, phase, speed } = node.userData
        node.position.y = originalPos.y + Math.sin(time * speed + phase) * 0.8
        node.position.x = originalPos.x + Math.cos(time * speed * 0.7 + phase) * 0.4
        
        // Pulse the glow
        const scale = 1 + Math.sin(time * 2 + phase) * 0.05
        node.children.forEach((child, i) => {
          if (i > 1) child.scale.setScalar(scale)
        })
      })

      // Animate particles
      particles.rotation.y = time * 0.01
      const pPositions = particles.geometry.attributes.position.array
      for (let i = 0; i < particleCount; i++) {
        pPositions[i * 3 + 1] += Math.sin(time + i) * 0.002
      }
      particles.geometry.attributes.position.needsUpdate = true

      renderer.render(scene, camera)
    }

    animate()

    // Resize
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
        <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10">
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
          className="bg-black/40 backdrop-blur-md rounded-xl px-4 py-2 text-white text-xs hover:bg-black/60 transition-all w-fit border border-white/10"
        >
          {isRotating ? '⏸ Pause' : '▶ Play'}
        </button>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <div className="text-white/40 text-sm tracking-widest font-light">HEAVEN</div>
      </div>
      <div className="absolute bottom-4 left-4 z-10 text-white/30 text-xs">
        Drag to rotate • Scroll to zoom
      </div>
      <div ref={containerRef} className="flex-1 cursor-grab active:cursor-grabbing" />
    </div>
  )
}