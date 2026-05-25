import { useMemo } from 'react';
import { usePhotoStore } from '../store';
import { generateMemories, type MemoryGroup } from '../services/memories';

export function useMemoryPhotos(): MemoryGroup[] {
  const photos = usePhotoStore((s) => s.photos);

  return useMemo(() => generateMemories(photos), [photos]);
}
