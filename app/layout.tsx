import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Navbar } from '@/components/shared/Navbar'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'BoardGame Catalog',
  description: 'Discover and organize your board game collection.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} font-sans antialiased`}>
        <NuqsAdapter>
          <TooltipProvider>
            <Navbar />
            <main className="container mx-auto px-4 py-6">
              {children}
            </main>
          </TooltipProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}
