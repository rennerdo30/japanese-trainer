'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const ConvexClientProvider = dynamic(
  () => import('@/lib/convex').then((mod) => mod.ConvexClientProvider),
  { ssr: false }
);

export function Providers({ children }: { children: ReactNode }) {
  return <ConvexClientProvider>{children}</ConvexClientProvider>;
}
