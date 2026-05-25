import { useMemo } from 'react';
import type { Photo } from '../types';

export interface RowItem {
  photo: Photo;
  width: number;
  height: number;
}

export interface JustifiedRow {
  type: 'row';
  id: string;
  items: RowItem[];
  rowHeight: number;
}

export interface DateRow {
  type: 'date';
  id: string;
  label: string;
}

export type LayoutItem = DateRow | JustifiedRow;

const MIN_DISPLAY_RATIO = 0.72;
const MAX_DISPLAY_RATIO = 2.05;
const MIN_ROW_HEIGHT = 116;
const MAX_ROW_HEIGHT = 190;

function getDisplayRatio(photo: Photo): number {
  const naturalRatio = photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 1;
  return Math.min(MAX_DISPLAY_RATIO, Math.max(MIN_DISPLAY_RATIO, naturalRatio));
}

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

function packRows(photos: Photo[], screenWidth: number, targetRowHeight: number): JustifiedRow[] {
  const rows: JustifiedRow[] = [];
  const usableWidth = screenWidth;
  let currentItems: RowItem[] = [];
  let sumRatios = 0;

  const flushRow = (isLast: boolean) => {
    if (currentItems.length === 0) return;

    let rowHeight: number;
    if (isLast) {
      rowHeight = targetRowHeight;
    } else {
      rowHeight = usableWidth / sumRatios;
    }
    rowHeight = Math.min(MAX_ROW_HEIGHT, Math.max(MIN_ROW_HEIGHT, rowHeight));

    const finalItems = currentItems.map((item) => ({
      ...item,
      width: rowHeight * getDisplayRatio(item.photo),
      height: rowHeight,
    }));

    rows.push({
      type: 'row',
      id: `row-${rows.length}-${currentItems[0].photo.id}`,
      items: finalItems,
      rowHeight,
    });

    currentItems = [];
    sumRatios = 0;
  };

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const ar = getDisplayRatio(photo);

    currentItems.push({ photo, width: 0, height: 0 });
    sumRatios += ar;

    if (targetRowHeight * sumRatios >= usableWidth) {
      flushRow(false);
    }
  }

  if (currentItems.length > 0) {
    flushRow(true);
  }

  return rows;
}

export function useJustifiedLayout(
  photos: Photo[],
  screenWidth: number,
  targetRowHeight: number = 120,
): LayoutItem[] {
  return useMemo(() => {
    const result: LayoutItem[] = [];
    let lastDate = '';
    let currentDatePhotos: Photo[] = [];

    const flushDateGroup = () => {
      if (currentDatePhotos.length === 0) return;
      const rows = packRows(currentDatePhotos, screenWidth, targetRowHeight);
      result.push(...rows);
      currentDatePhotos = [];
    };

    for (const p of photos) {
      if (p.dateTaken !== lastDate) {
        flushDateGroup();
        result.push({ type: 'date', id: `date-${p.dateTaken}`, label: formatDateLabel(p.dateTaken) });
        lastDate = p.dateTaken;
      }
      currentDatePhotos.push(p);
    }
    flushDateGroup();

    return result;
  }, [photos, screenWidth, targetRowHeight]);
}
