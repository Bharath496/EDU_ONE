import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'EduOne - All-in-One College Management Platform',
  description: 'A comprehensive multi-tenant SaaS platform for college management including academics, attendance, exams, fees, and communication.',
  keywords: ['college management', 'ERP', 'attendance', 'fees', 'exams', 'LMS', 'SaaS'],
  authors: [{ name: 'EduOne Team' }],
  creator: 'EduOne',
  publisher: 'EduOne',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://eduone.app',
    title: 'EduOne - All-in-One College Management Platform',
    description: 'Streamline your institution with EduOne - academics, attendance, exams, fees, and communication in one platform.',
    siteName: 'EduOne',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduOne - All-in-One College Management Platform',
    description: 'Streamline your institution with EduOne.',
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}