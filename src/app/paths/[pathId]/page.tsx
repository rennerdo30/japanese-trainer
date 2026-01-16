import learningPathsData from '@/data/learning-paths.json';
import PathDetailContent from './PathDetailContent';

// Generate static params for all paths (server-side)
export function generateStaticParams() {
  const pathsData = learningPathsData as { pathOrder: string[] };
  return pathsData.pathOrder.map((pathId) => ({
    pathId,
  }));
}

export default function PathDetailPage() {
  return <PathDetailContent />;
}
