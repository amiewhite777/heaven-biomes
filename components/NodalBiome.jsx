'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const biomes = {
  cosmic: {
    name: 'Cosmic Flow',
    image: 'https://i.postimg.cc/F1Xzt9vQ/IMG-0979.jpg',
    nodeCore: 0xffffff,
    nodeGlow: 0x88ddff,
    nodeOuter: 0x4488cc,
    ribbonColor: 0xcceeFF,
    ribbonGold: 0xffeecc,
  },
  infernal: {
    name: 'Infernal Grid',
    image: 'https://i.postimg.cc/Pfp41h6w/IMG-0980.jpg',
    nodeCore: 0xffeeee,
    nodeGlow: 0xff6644,
    nodeOuter: 0xcc3322,
    ribbonColor: 0x442222,
    ribbonGold: 0xff4422,
  },
  diamond: {
    name: 'Diamond Web',
    image: 'https://i.postimg.cc/FHZghKKC/IMG-0995.jpg',
    nodeCore: 0xffffff,
    nodeGlow: 0xaaccff,
    nodeOuter: 0x6688cc,
    ribbonColor: 0x8899bb,
    ribbonGold: 0xffffff,
  },
  ethereal: {
    name: 'Ethereal Nebula',
    image: 'https://i.postimg.cc/vB1W7LtS/IMG-1005.jpg',
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

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.z = 55

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const textureLoader = new THREE.TextureLoader()
    textureLoader.crossOrigin = 'anonymous'
    textureLoader.load(biome.image, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      scene.background = texture
    })

    const mainGroup = new THREE.Group()
    scene.add(mainGroup)

    const createNode = (size, position) => {
      const nodeGroup = new THREE.Group()
      nodeGroup.position.copy(position)

      const coreGeom = new THREE.SphereGeometry(size * 0.4, 32, 32)
      const coreMat = new THREE.MeshBasicMaterial({ color: biome.nodeCore })
      nodeGroup.add(new THREE.Mesh(coreGeom, coreMat))

      const innerGlowGeom = new THREE.SphereGeometry(size * 0.7, 32, 32)
      const innerGlowMat = new THREE.MeshBasicMaterial({ color: biome.nodeGlow, transparent: true, opacity: 0.6 })
      nodeGroup.add(new THREE.Mesh(innerGlowGeom, innerGlowMat))

      const outerGlowGeom = new THREE.SphereGeometry(size, 32, 32)
      const outerGlowMat = new THREE.MeshBasicMaterial({ color: biome.nodeOuter, transparent: true, opacity: 0.3 })
      nodeGroup.add(new THREE.Mesh(outerGlowGeom, outerGlowMat))

      const haloGeom = new THREE.SphereGeometry(size * 1.8, 32, 32)
      const haloMat = new THREE.MeshBasicMaterial({ color: biome.nodeGlow, transparent: true, opacity: 0.1, depthWrite: false })
      nodeGroup.add(new THREE.Mesh(haloGeom, haloMat))

      nodeGroup.userData = { originalPos: position.clone(), phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.3 }
      return nodeGroup
    }

    const createRibbon = (startPos, endPos, isGold = false) => {
      const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5)
      midPoint.add(new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 5))
      const curve = new THREE.CatmullRomCurve3([startPos.clone(), midPoint, endPos.clone()])

      const tubeGeom = new THREE.TubeGeometry(curve, 32, 0.15, 8, false)
      const tubeMat = new THREE.MeshBasicMaterial({ color: isGold ? biome.ribbonGold : biome.ribbonColor, transparent: true, opacity: isGold ? 0.5 : 0.35, depthWrite: false })
      
      const innerTubeGeom = new THREE.TubeGeometry(curve, 32, 0.05, 8, false)
      const innerTubeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, depthWrite: false })

      const ribbonGroup = new THREE.Group()
      ribbonGroup.add(new THREE.Mesh(tubeGeom, tubeMat))
      ribbonGroup.add(new THREE.Mesh(innerTubeGeom, innerTubeMat))
      return ribbonGroup
    }

    const nodes = []
    const nodePositions = [
      new THREE.Vector3(-25, 8, 0), new THREE.Vector3(-18, -5, 5), new THREE.Vector3(-10, 12, -5),
      new THREE.Vector3(-8, -8, 8), new THREE.Vector3(-2, 5, 0), new THREE.Vector3(5, -3, 5),
      new THREE.Vector3(8, 10, -3), new THREE.Vector3(12, -6, 0), new THREE.Vector3(18, 8, 5),
      new THREE.Vector3(22, -2, -5), new THREE.Vector3(28, 5, 3), new THREE.Vector3(-15, 0, -8),
      new THREE.Vector3(0, -10, -5), new THREE.Vector3(15, 0, -10),
    ]

    nodePositions.forEach((pos) => {
      const node = createNode(1.5 + Math.random() * 2, pos)
      nodes.push(node)
      mainGroup.add(node)
    })

    const connections = [[0,1],[0,2],[1,3],[1,4],[2,4],[2,6],[3,5],[4,5],[4,6],[5,7],[6,8],[7,9],[8,9],[8,10],[9,10],[11,0],[11,1],[11,2],[12,3],[12,5],[12,7],[13,9],[13,10],[4,7]]
    connections.forEach(([a, b], i) => mainGroup.add(createRibbon(nodePositions[a], nodePositions[b], i % 4 === 0)))

    const particleCount = 300
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount * 3; i++) positions[i] = (Math.random() - 0.5) * (i % 3 === 2 ? 60 : i % 3 === 1 ? 80 : 120)
    const particlesGeom = new THREE.BufferGeometry()
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particles = new THREE.Points(particlesGeom, new THREE.PointsMaterial({ color: 0xffffee, size: 0.3, transparent: true, opacity: 0.6 }))
    scene.add(particles)

    let isDragging = false, previousMousePosition = { x: 0, y: 0 }, targetRotationX = 0, targetRotationY = 0

    const onMouseDown = (e) => { isDragging = true; previousMousePosition = { x: e.clientX, y: e.clientY } }
    const onMouseMove = (e) => { if (!isDragging) return; targetRotationY += (e.clientX - previousMousePosition.x) * 0.005; targetRotationX += (e.clientY - previousMousePosition.y) * 0.005; previousMousePosition = { x: e.clientX, y: e.clientY } }
    const onMouseUp = () => { isDragging = false }
    const onTouchStart = (e) => { isDragging = true; previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
    const onTouchMove = (e) => { if (!isDragging) return; targetRotationY += (e.touches[0].clientX - previousMousePosition.x) * 0.005; targetRotationX += (e.touches[0].clientY - previousMousePosition.y) * 0.005; previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
    const onWheel = (e) => { camera.position.z = Math.max(30, Math.min(100, camera.position.z + e.deltaY * 0.05)) }

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

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const time = clock.getElapsedTime()

      if (isRotating && !isDragging) targetRotationY += 0.001
      mainGroup.rotation.x += (targetRotationX - mainGroup.rotation.x) * 0.03
      mainGroup.rotation.y += (targetRotationY - mainGroup.rotation.y) * 0.03

      nodes.forEach((node) => {
        const { originalPos, phase, speed } = node.userData
        node.position.y = originalPos.y + Math.sin(time * speed + phase) * 0.8
        node.position.x = originalPos.x + Math.cos(time * speed * 0.7 + phase) * 0.4
        const scale = 1 + Math.sin(time * 2 + phase) * 0.05
        node.children.forEach((child, i) => { if (i > 1) child.scale.setScalar(scale) })
      })

      particles.rotation.y = time * 0.01
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => { camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight) }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
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
              <button key={key} onClick={() => setCurrentBiome(key)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${currentBiome === key ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>{value.name}</button>
            ))}
          </div>
        </div>
        <button onClick={() => setIsRotating(!isRotating)} className="bg-black/40 backdrop-blur-md rounded-xl px-4 py-2 text-white text-xs hover:bg-black/60 transition-all w-fit border border-white/10">{isRotating ? '⏸ Pause' : '▶ Play'}</button>
      </div>
      <div className="absolute top-4 right-4 z-10"><div className="text-white/40 text-sm tracking-widest font-light">HEAVEN</div></div>
      <div className="absolute bottom-4 left-4 z-10 text-white/30 text-xs">Drag to rotate • Scroll to zoom</div>
      <div ref={containerRef} className="flex-1 cursor-grab active:cursor-grabbing" />
    </div>
  )
}