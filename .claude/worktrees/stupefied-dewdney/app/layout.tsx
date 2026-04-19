import type { Metadata } from 'next'
import { DM_Sans, Bebas_Neue } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AI Fitness Trainer — AIFIT',
  description:
    'Real-time AI-powered fitness coaching with MediaPipe pose detection, AR form overlay, and live training rooms. Final year project — MPSTME Mumbai.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`dark ${dmSans.variable} ${bebasNeue.variable}`}
    >
      <body className={`${dmSans.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
