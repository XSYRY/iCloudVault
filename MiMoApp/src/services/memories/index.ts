import type { Photo } from '../../types';

export interface MemoryGroup {
  type: 'on-this-day' | 'seasonal' | 'location' | 'people';
  title: string;
  subtitle: string;
  photos: Photo[];
  dateLabel: string;
}

export function generateMemories(photos: Photo[]): MemoryGroup[] {
  const now = new Date();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  const currentYear = now.getFullYear();

  const activePhotos = photos.filter((p) => !p.isDeleted);
  const memories: MemoryGroup[] = [];

  const onThisDay = activePhotos.filter((p) => {
    if (!p.dateTaken) return false;
    const d = new Date(p.dateTaken);
    return d.getMonth() + 1 === todayMonth && d.getDate() === todayDay && d.getFullYear() < currentYear;
  });

  if (onThisDay.length > 0) {
    const yearsAgo = currentYear - new Date(onThisDay[0].dateTaken).getFullYear();
    memories.push({
      type: 'on-this-day',
      title: '那年今天',
      subtitle: `${yearsAgo}年前的今天`,
      photos: onThisDay,
      dateLabel: onThisDay[0].dateTaken,
    });
  }

  const seasonMap: Record<string, { months: number[]; label: string }> = {
    '春': { months: [3, 4, 5], label: '春日时光' },
    '夏': { months: [6, 7, 8], label: '夏日回忆' },
    '秋': { months: [9, 10, 11], label: '秋日物语' },
    '冬': { months: [12, 1, 2], label: '冬日暖阳' },
  };

  const currentSeason = Object.entries(seasonMap).find(([, v]) =>
    v.months.includes(todayMonth),
  );
  if (currentSeason) {
    const seasonPhotos = activePhotos.filter((p) => {
      if (!p.dateTaken) return false;
      const m = new Date(p.dateTaken).getMonth() + 1;
      return currentSeason[1].months.includes(m) && new Date(p.dateTaken).getFullYear() < currentYear;
    });
    if (seasonPhotos.length >= 3) {
      memories.push({
        type: 'seasonal',
        title: currentSeason[1].label,
        subtitle: `往昔${currentSeason[0]}日精选`,
        photos: seasonPhotos.slice(0, 10),
        dateLabel: `${currentSeason[0]}季`,
      });
    }
  }

  const locationGroups = new Map<string, Photo[]>();
  for (const p of activePhotos) {
    if (p.locationName) {
      const arr = locationGroups.get(p.locationName) || [];
      arr.push(p);
      locationGroups.set(p.locationName, arr);
    }
  }
  for (const [loc, locPhotos] of locationGroups) {
    if (locPhotos.length >= 5) {
      memories.push({
        type: 'location',
        title: loc,
        subtitle: `${locPhotos.length} 张照片`,
        photos: locPhotos.slice(0, 10),
        dateLabel: loc,
      });
    }
  }

  return memories;
}
