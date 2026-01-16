/**
 * useTargetLanguage Hook
 * Re-exports from TargetLanguageProvider for backward compatibility
 *
 * All components using this hook will share the same state through React Context,
 * ensuring they all update when the target language changes.
 */

'use client';

// Re-export everything from the context provider
export {
  useTargetLanguage,
  TargetLanguageProvider,
  type TargetLanguageContextType,
  type UseTargetLanguageReturn,
} from '@/context/TargetLanguageProvider';

// Default export for backward compatibility
export { useTargetLanguage as default } from '@/context/TargetLanguageProvider';
