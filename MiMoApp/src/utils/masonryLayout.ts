import type { Photo } from '../types';

export interface MasonryPhotoItem {
  photo: Photo;
  width: number;
  height: number;
}

export interface DateHeaderItem {
  type: 'date';
  id: string;
  label: string;
}

export interface MasonryRow {
  type: 'row';
  id: string;
  items: MasonryPhotoItem[];
  rowHeight: number;
}

export type MasonryLayoutItem = DateHeaderItem | MasonryRow;

export const DATE_ITEM_HEIGHT = 36;

function formatDateLabel(dateTaken: string): string {
  const today = new Date();
  const d = new Date(dateTaken);
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  if (dateTaken === todayStr) return '今天';
  if (dateTaken === yesterdayStr) return '昨天';
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function computeMasonryLayout(
  photos: Photo[],
  columns: number,
  containerWidth: number,
  gap: number = 2,
): MasonryLayoutItem[] {
  if (photos.length === 0 || columns < 1) return [];

  const columnWidth = (containerWidth - gap * (columns - 1)) / columns;
  const result: MasonryLayoutItem[] = [];

  type ColumnQueue = MasonryPhotoItem[];
  const columnQueues: ColumnQueue[] = Array.from({ length: columns }, () => []);
  const columnHeights: number[] = new Array(columns).fill(0);

  let currentDate = '';
  let dateGroup: Photo[] = [];

  function flushDateGroup() {
    if (dateGroup.length === 0) return;

    result.push({
      type: 'date',
      id: `date-${currentDate}`,
      label: formatDateLabel(currentDate),
    });

    for (const photo of dateGroup) {
      const minCol = columnHeights.indexOf(Math.min(...columnHeights));
      const photoHeight = columnWidth / (photo.width / photo.height);

      columnQueues[minCol].push({
        photo,
        width: columnWidth,
        height: photoHeight,
      });

      columnHeights[minCol] += photoHeight + gap;
    }

    const maxItems = Math.max(...columnQueues.map((q) => q.length));
    for (let rowIdx = 0; rowIdx < maxItems; rowIdx++) {
      const rowItems: MasonryPhotoItem[] = [];
      let maxH = 0;

      for (let col = 0; col < columns; col++) {
        const item = columnQueues[col][rowIdx];
        if (item) {
          rowItems.push(item);
          if (item.height > maxH) maxH = item.height;
        }
      }

      if (rowItems.length > 0) {
        result.push({
          type: 'row',
          id: `row-${currentDate}-${rowIdx}`,
          items: rowItems,
          rowHeight: maxH,
        });
      }
    }

    const groupMax = Math.max(...columnHeights);
    for (let i = 0; i < columns; i++) {
      columnHeights[i] = groupMax;
      columnQueues[i] = [];
    }

    dateGroup = [];
  }

  for (const p of photos) {
    if (p.dateTaken !== currentDate) {
      flushDateGroup();
      currentDate = p.dateTaken;
    }
    dateGroup.push(p);
  }
  flushDateGroup();

  return result;
}

export function getMasonryItemLayout(
  item: MasonryLayoutItem,
  gap: number = 2,
): { length: number; offset: number } {
  if (item.type === 'date') {
    return { length: DATE_ITEM_HEIGHT, offset: 0 };
  }
  return { length: item.rowHeight + gap, offset: 0 };
}
