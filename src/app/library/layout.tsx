import ErrorBoundary from '@/components/common/ErrorBoundary';
import LanguageContentGuard from '@/components/common/LanguageContentGuard';

export const metadata = {
  title: 'Library | Murmura',
  description: 'Browse and review all learning materials',
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <LanguageContentGuard moduleName="vocabulary" supportedLanguages={['ja', 'ko', 'zh', 'es', 'de', 'en', 'it', 'fr', 'pt']}>
        {children}
      </LanguageContentGuard>
    </ErrorBoundary>
  );
}
