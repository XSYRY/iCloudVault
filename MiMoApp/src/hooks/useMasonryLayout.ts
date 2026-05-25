import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { computeMasonryLayout, DATE_ITEM_HEIGHT } from '../utils/masonryLayout';
import type { MasonryLayoutItem } from '../utils/masonryLayout';

export { DATE_ITEM_HEIGHT };
import type { Photo } from '../types';

export function useMasonryLayout(
  photos: Photo[],
  columns: number,
  gap: number = 2,
): MasonryLayoutItem[] {
  const { width: screenWidth } = useWindowDimensions();

  return useMemo(
    () => computeMasonryLayout(photos, columns, screenWidth, gap),
    [photos, columns, screenWidth, gap],
  );
}

export type { MasonryLayoutItem };
