import { useMemo } from 'react';
import { usePhotoStore } from '../store';
import type { Photo, Category, SortMode } from '../types';

// ============================================================
// usePhotos — 带筛选/排序/分组逻辑的照片查询 hook
// 组件只需调用此 hook，不直接访问 photoStore 内部实现
// ============================================================

interface UsePhotosOptions {
  category?: Category | null;
  favoriteOnly?: boolean;
  sort?: SortMode;
  limit?: number;
}

export function usePhotos(options: UsePhotosOptions = {}) {
  const photos = usePhotoStore((s) => s.photos);
  const sortMode = usePhotoStore((s) => s.sortMode);
  const filter = usePhotoStore((s) => s.filter);

  // 解构 options 字段，避免对象引用不稳定导致 useMemo 频繁重新执行
  const { category: optCategory, favoriteOnly, sort: optSort, limit } = options;

  const result = useMemo(() => {
    let list = photos.filter((p) => !p.isDeleted);

    const cat = optCategory ?? filter.category;
    if (cat) list = list.filter((p) => p.aiCategory === cat);

    const fav = favoriteOnly ?? filter.isFavorite;
    if (fav) list = list.filter((p) => p.isFavorite);

    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.filename.toLowerCase().includes(q) ||
          p.aiTags?.some((t) => t.toLowerCase().includes(q)) ||
          p.locationName?.toLowerCase().includes(q) ||
          p.memo?.toLowerCase().includes(q) ||
          p.dateTaken.includes(q),
      );
    }

    const s = optSort ?? sortMode;
    list.sort((a, b) => {
      switch (s) {
        case 'date-asc': return a.createdAt - b.createdAt;
        case 'name': return a.filename.localeCompare(b.filename);
        case 'size': return a.sizeBytes - b.sizeBytes;
        default: return b.createdAt - a.createdAt;
      }
    });

    return limit ? list.slice(0, limit) : list;
  }, [photos, filter, sortMode, optCategory, favoriteOnly, optSort, limit]);

  return result;
}

// 按月份分组（给时间线视图用）
export function usePhotosGroupedByMonth() {
  const photos = usePhotos();

  return useMemo(() => {
    const groups = new Map<string, Photo[]>();
    for (const p of photos) {
      const month = p.dateTaken.slice(0, 7); // "2025-03"
      const arr = groups.get(month) || [];
      arr.push(p);
      groups.set(month, arr);
    }
    return Array.from(groups.entries())
      .map(([month, items]) => ({ month, items }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [photos]);
}

// 按位置分组（给地图视图用）
export function usePhotosGroupedByLocation() {
  const photos = usePhotos();

  return useMemo(() => {
    const groups = new Map<string, Photo[]>();
    for (const p of photos) {
      if (!p.latitude || !p.longitude) continue;
      const key = p.locationName || `${p.latitude.toFixed(4)},${p.longitude.toFixed(4)}`;
      const arr = groups.get(key) || [];
      arr.push(p);
      groups.set(key, arr);
    }
    return Array.from(groups.entries()).map(([location, items]) => ({
      location,
      latitude: items[0].latitude!,
      longitude: items[0].longitude!,
      items,
    }));
  }, [photos]);
}
