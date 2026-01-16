'use client';

import { ReactNode, useEffect } from 'react';
import LearningCompanion from '@/components/LearningCompanion/LearningCompanion';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { targetLanguage } = useTargetLanguage();

  // Apply theme based on target language at the root level
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', targetLanguage);
    }
  }, [targetLanguage]);

  return (
    <>
      {children}
      <LearningCompanion position="sidebar" />
    </>
  );
}
