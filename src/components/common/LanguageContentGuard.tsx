'use client';

import { ReactNode } from 'react';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import { useLanguage } from '@/context/LanguageProvider';
import Navigation from '@/components/common/Navigation';
import { Container, Card, Text, Button } from '@/components/ui';
import { IoConstruct, IoArrowBack } from 'react-icons/io5';
import Link from 'next/link';

interface LanguageContentGuardProps {
  children: ReactNode;
  moduleName: string;
  /** Languages that have data for this module */
  supportedLanguages?: string[];
}

// Define which languages have actual DATA for each module
// This is separate from language-configs.json which defines which modules a language SHOULD have
// A language might have a module enabled but no data yet (shows "Coming Soon")
const MODULE_DATA_AVAILABILITY: Record<string, string[]> = {
  alphabet: ['ja', 'ko'],                           // Japanese (Hiragana/Katakana), Korean (Hangul)
  vocabulary: ['ja', 'ko', 'zh', 'es', 'de', 'en', 'it'], // Japanese, Korean, Chinese, Spanish, German, English, Italian
  kanji: ['ja', 'zh'],                              // Japanese (Kanji), Chinese (Hanzi)
  grammar: ['ja', 'ko', 'zh', 'es', 'de', 'en', 'it'],    // Japanese, Korean, Chinese, Spanish, German, English, Italian
  reading: ['ja', 'es'],                            // Japanese and Spanish
  listening: ['ja'],                                // Only Japanese has listening data for now
};

export default function LanguageContentGuard({
  children,
  moduleName,
  supportedLanguages
}: LanguageContentGuardProps) {
  const { targetLanguage, languageConfig } = useTargetLanguage();
  const { t } = useLanguage();

  // Use provided supported languages or fall back to default
  const availableLanguages = supportedLanguages || MODULE_DATA_AVAILABILITY[moduleName] || [];

  // Check if current language has data for this module
  const hasData = availableLanguages.includes(targetLanguage);

  if (!hasData) {
    return (
      <Container variant="centered">
        <Navigation />
        <Card variant="glass" style={{ maxWidth: '500px', margin: '2rem auto', padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', color: 'var(--accent-gold)' }}>
            <IoConstruct />
          </div>
          <Text variant="h2" align="center" style={{ marginBottom: '1rem' }}>
            Coming Soon
          </Text>
          <Text variant="body" color="secondary" align="center" style={{ marginBottom: '0.5rem' }}>
            {languageConfig?.name || targetLanguage.toUpperCase()} content for this module is not yet available.
          </Text>
          <Text variant="caption" color="muted" align="center" style={{ marginBottom: '2rem' }}>
            This module is currently available for: {availableLanguages.length > 0 ? availableLanguages.map(l => l.toUpperCase()).join(', ') : 'No languages yet'}. We&apos;re working on adding more!
          </Text>
          <Link href="/">
            <Button variant="primary">
              <IoArrowBack style={{ marginRight: '0.5rem' }} />
              Back to Dashboard
            </Button>
          </Link>
        </Card>
      </Container>
    );
  }

  return <>{children}</>;
}
