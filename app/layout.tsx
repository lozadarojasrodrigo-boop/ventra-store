import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { CartProvider } from '@/app/components/CartProvider'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://ventrabolivia.com'),
  title: {
    default: 'VENTRA Bolivia',
    template: '%s | VENTRA Bolivia',
  },
  applicationName: 'VENTRA Bolivia',
  description: 'Compra online en VENTRA Bolivia. Descubre productos, sigue tu pedido y confirma tu compra por QR o transferencia.',
  keywords: [
    'VENTRA',
    'VENTRA Bolivia',
    'tienda online Bolivia',
    'compras online Bolivia',
    'QR',
    'transferencia',
  ],
  icons: {
    icon: [
      { url: '/logoweb.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/logoweb.png', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    url: 'https://ventrabolivia.com',
    siteName: 'VENTRA Bolivia',
    title: 'VENTRA Bolivia',
    description:
      'Compra online en VENTRA Bolivia. Productos, pedidos y seguimiento desde una sola tienda.',
    images: [
      {
        url: '/logoweb.png',
        width: 512,
        height: 512,
        alt: 'VENTRA Bolivia',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'VENTRA Bolivia',
    description:
      'Compra online en VENTRA Bolivia. Productos, pedidos y seguimiento desde una sola tienda.',
    images: ['/logoweb.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  )
}
