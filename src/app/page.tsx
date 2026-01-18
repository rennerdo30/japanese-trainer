'use client';

import Dashboard from '@/components/layout/Dashboard';
import ErrorBoundary from '@/components/common/ErrorBoundary';

export default function Home() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
