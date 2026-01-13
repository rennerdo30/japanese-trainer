'use client'

import { ConvexProvider, ConvexReactClient } from 'convex/react';

// Initialize Convex client
// The CONVEX_URL will be set via environment variable
// If not set, Convex will be disabled and localStorage will be used instead
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export { ConvexProvider, convex };
