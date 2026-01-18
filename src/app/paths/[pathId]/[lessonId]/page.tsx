import learningPathsData from '@/data/learning-paths.json';
import LessonContent from './LessonContent';

interface PathMilestone {
  id: string;
  level: string;
  name: string;
  module: string;
}

interface LinearPath {
  id: string;
  type: 'linear';
  milestones: PathMilestone[];
}

interface TopicTrack {
  id: string;
  type: 'topic';
}

const pathsData = learningPathsData as {
  paths: Record<string, LinearPath | TopicTrack>;
  pathOrder: string[];
};

// Generate static params for all paths and their lessons/milestones
export function generateStaticParams() {
  const params: { pathId: string; lessonId: string }[] = [];

  for (const pathId of pathsData.pathOrder) {
    const pathData = pathsData.paths[pathId];

    if (pathData?.type === 'linear') {
      const linearPath = pathData as LinearPath;
      for (const milestone of linearPath.milestones) {
        params.push({
          pathId,
          lessonId: milestone.id,
        });
      }
    }
  }

  return params;
}

export default function LessonPage() {
  return <LessonContent />;
}
