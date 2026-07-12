import './globals.css'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'JolDos — помощь на дороге',
  description: 'Найдём ближайшего мастера или эвакуатор',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
      </head>

      <body>
        {children}

        <Script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
