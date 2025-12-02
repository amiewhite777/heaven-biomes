'use client'

import dynamic from 'next/dynamic'

const NodalBiome = dynamic(() => import('../components/NodalBiome'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="text-white/50 text-sm tracking-widest animate-pulse">
        ENTERING BIOME...
      </div>
    </div>
  )
})

export default function Home() {
  return <NodalBiome />
}