import '../styles/globals.css'
import { ProgressProvider } from '@/context/ProgressProvider'
import { SettingsProvider } from '@/context/SettingsProvider'
import { LanguageProvider } from '@/context/LanguageProvider'
import { ConvexProvider, convex } from '@/lib/convex'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Japanese Trainer - Learn Japanese',
  description: 'Comprehensive Japanese learning platform. Master Hiragana, Katakana, Vocabulary, Kanji, Grammar, Reading, and Listening.',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  // Only wrap with ConvexProvider if Convex is configured
  const content = (
    <LanguageProvider>
      <SettingsProvider>
        <ProgressProvider>
          {children}
        </ProgressProvider>
      </SettingsProvider>
    </LanguageProvider>
  );

  return (
    <html lang="en">
      <body>
        {convex ? (
          <ConvexProvider client={convex}>
            <ConvexAuthProvider client={convex}>
              {content}
            </ConvexAuthProvider>
          </ConvexProvider>
        ) : (
          content
        )}
      </body>
    </html>
  )
}
