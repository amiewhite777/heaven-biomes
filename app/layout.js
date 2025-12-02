import './globals.css'

export const metadata = {
  title: 'Heaven — Bespoke Biomes',
  description: 'Interactive 3D biome environments for Heaven',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}