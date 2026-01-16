import '../styles/globals.css'
import { ProgressProvider } from '@/context/ProgressProvider'
import { SettingsProvider } from '@/context/SettingsProvider'
import { LanguageProvider } from '@/context/LanguageProvider'
import { Providers } from '@/components/providers'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Japanese Trainer - Learn Japanese',
  description: 'Comprehensive Japanese learning platform. Master Hiragana, Katakana, Vocabulary, Kanji, Grammar, Reading, and Listening.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <LanguageProvider>
            <SettingsProvider>
              <ProgressProvider>
                {children}
              </ProgressProvider>
            </SettingsProvider>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  )
}
