import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'EDU_ONE | College Operating System Demo',
    template: '%s | EDU_ONE',
  },
  description:
    'A portfolio-grade multi-role college operating system demo with connected student, attendance, academic, fee, library, reporting and analytics workflows.',
  keywords: ['college management', 'student management', 'attendance', 'education technology', 'Next.js', 'FastAPI'],
  creator: 'EDU_ONE',
  manifest: '/EDU_ONE/manifest.webmanifest',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://bharath496.github.io/EDU_ONE/',
    title: 'EDU_ONE | College Operating System Demo',
    description: 'Interactive multi-role college operations portfolio project built with Next.js, TypeScript and FastAPI.',
    siteName: 'EDU_ONE',
  },
  twitter: {
    card: 'summary',
    title: 'EDU_ONE | College Operating System Demo',
    description: 'Interactive multi-role college operations portfolio project.',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
