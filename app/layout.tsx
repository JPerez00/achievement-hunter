import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Achievement Hunter - Steam Game Checker',
  description: 'Discover achievement status, Steam Deck compatibility, and more for your favorite Steam games',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html 
    lang="en"
    suppressHydrationWarning
    >
      <body className='antialiased'>
        {children}
      </body>
    </html>
  )
}
