import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meta-Agent System',
  description: 'Advanced AI Agent Management Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
} 