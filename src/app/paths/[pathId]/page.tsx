import * as fs from 'fs';
import * as path from 'path';
import PathDetailContent from './PathDetailContent';
import languageConfigs from '@/data/language-configs.json';

// Use dynamic config instead of hardcoded list
const LANGUAGES = languageConfigs.availableLanguages;

interface LegacyPath {
  path: {
    slug: string;
  };
}

interface LearningPathsData {
  paths: Record<string, { id: string }>;
  pathOrder: string[];
}

/**
 * Generate static params for all path pages at build time.
 * Reads both curriculum.json (legacy) and learning-paths.json (AI-generated).
 */
export async function generateStaticParams() {
  const params: { pathId: string }[] = [];
  const dataDir = path.join(process.cwd(), 'public', 'data');

  for (const lang of LANGUAGES) {
    const curriculumPath = path.join(dataDir, lang, 'curriculum.json');
    const learningPathsPath = path.join(dataDir, lang, 'learning-paths.json');

    // Read legacy curriculum.json
    if (fs.existsSync(curriculumPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'));

        // Handle legacy format (array of path objects)
        if (Array.isArray(data)) {
          for (const item of data as LegacyPath[]) {
            if (item.path?.slug) {
              params.push({ pathId: item.path.slug });
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to read curriculum for ${lang}:`, error);
      }
    }

    // Read AI-generated learning-paths.json
    if (fs.existsSync(learningPathsPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(learningPathsPath, 'utf-8')) as LearningPathsData;

        // AI format: { paths: { "path-id": { ... } }, pathOrder: [...] }
        if (data.paths) {
          for (const pathId of Object.keys(data.paths)) {
            params.push({ pathId });
          }
        }
      } catch (error) {
        console.warn(`Failed to read learning-paths for ${lang}:`, error);
      }
    }
  }

  // Deduplicate
  const uniqueParams = Array.from(
    new Map(params.map((p) => [p.pathId, p])).values()
  );

  return uniqueParams;
}

export default function PathDetailPage() {
  return <PathDetailContent />;
}
