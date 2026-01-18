'use client';

import { ReactNode } from 'react';
import LearningCompanion from '@/components/LearningCompanion/LearningCompanion';
import ErrorBoundary from '@/components/common/ErrorBoundary';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  // NOTE: Theme is applied by TargetLanguageProvider to avoid duplicate application
  // Do NOT add data-theme attribute here

  return (
    <ErrorBoundary>
      {children}
      <LearningCompanion position="sidebar" />
    </ErrorBoundary>
  );
}
