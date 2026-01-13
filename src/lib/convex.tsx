'use client';

import { ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ReactNode } from 'react';

// Initialize Convex client
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// Only create client if URL exists
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

// Export wrapper component
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // If no Convex URL, just render children without provider
  if (!convex) {
    console.warn('NEXT_PUBLIC_CONVEX_URL not set, Convex disabled');
    return <>{children}</>;
  }

  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
