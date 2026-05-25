import type { Photo, Album, Category } from '../../types';
import type { MemoryGroup } from '../memories';
import type {
  Story,
  StorySlide,
  StoryLayout,
  StoryTransition,
  StoryMusicMood,
  IStoryGenerator,
  StoryGeneratorOptions,
} from './types';

let storySeq = 0;
function nextStoryId(): string {
  return `story-${Date.now()}-${++storySeq}`;
}

function pickTransition(photo: Photo, prevPhoto: Photo | null): StoryTransition {
  if (!prevPhoto) return 'fade';
  if (photo.aiCategory === 'landscape') return 'zoom';
  if (photo.aiCategory === 'person') return 'fade';
  const sameDay = photo.dateTaken === prevPhoto.dateTaken;
  if (sameDay) return 'slide';
  return 'fade';
}

function computeDuration(photo: Photo): number {
  if (photo.aiCategory === 'landscape') return 6000;
  if (photo.aiCategory === 'person') return 4000;
  if (photo.aiCategory === 'food') return 3000;
  if (photo.aiCategory === 'document') return 5000;
  return 4000;
}

function groupByDate(photos: Photo[]): Map<string, Photo[]> {
  const groups = new Map<string, Photo[]>();
  for (const p of photos) {
    const key = p.dateTaken || 'unknown';
    const arr = groups.get(key) || [];
    arr.push(p);
    groups.set(key, arr);
  }
  return groups;
}

function groupByLocation(photos: Photo[]): Map<string, Photo[]> {
  const groups = new Map<string, Photo[]>();
  for (const p of photos) {
    const key = p.locationName || 'unknown';
    const arr = groups.get(key) || [];
    arr.push(p);
    groups.set(key, arr);
  }
  return groups;
}

function groupByCategory(photos: Photo[]): Map<Category | null, Photo[]> {
  const groups = new Map<Category | null, Photo[]>();
  for (const p of photos) {
    const key = p.aiCategory ?? null;
    const arr = groups.get(key) || [];
    arr.push(p);
    groups.set(key, arr);
  }
  return groups;
}

function buildSlides(photos: Photo[], maxSlides: number): StorySlide[] {
  const sorted = [...photos].sort((a, b) => a.createdAt - b.createdAt);
  const limited = sorted.slice(0, maxSlides);
  const slides: StorySlide[] = [];

  for (let i = 0; i < limited.length; i++) {
    const photo = limited[i];
    const prev = i > 0 ? limited[i - 1] : null;
    slides.push({
      photoId: photo.id,
      caption: buildCaption(photo),
      duration: computeDuration(photo),
      transition: pickTransition(photo, prev),
    });
  }

  return slides;
}

function buildCaption(photo: Photo): string {
  const parts: string[] = [];
  if (photo.locationName) parts.push(photo.locationName);
  if (photo.dateTaken) parts.push(photo.dateTaken);
  return parts.join(' · ');
}

function selectCover(photos: Photo[]): string {
  const sorted = [...photos].sort((a, b) => {
    const scoreA = (a.isFavorite ? 2 : 0) + (a.rating > 0 ? 1 : 0);
    const scoreB = (b.isFavorite ? 2 : 0) + (b.rating > 0 ? 1 : 0);
    return scoreB - scoreA;
  });
  return sorted[0]?.id || photos[0]?.id || '';
}

function inferLayout(photos: Photo[]): StoryLayout {
  const categories = new Set(photos.map((p) => p.aiCategory));
  if (categories.size <= 2 && categories.has('landscape')) return 'cinematic';
  if (categories.has('person') && categories.size >= 3) return 'magazine';
  const locations = new Set(photos.map((p) => p.locationName).filter(Boolean));
  if (locations.size >= 3) return 'timeline';
  return 'grid';
}

function inferMusicMood(photos: Photo[]): StoryMusicMood {
  const categories = photos.map((p) => p.aiCategory);
  const personCount = categories.filter((c) => c === 'person').length;
  const landscapeCount = categories.filter((c) => c === 'landscape').length;
  const total = categories.length || 1;

  if (landscapeCount / total > 0.5) return 'epic';
  if (personCount / total > 0.5) return 'nostalgic';
  if (categories.includes('food')) return 'upbeat';
  return 'calm';
}

function generateTitle(photos: Photo[]): string {
  if (photos.length === 0) return '我的故事';

  const dateGroups = groupByDate(photos);
  const locationGroups = groupByLocation(photos);
  const categoryGroups = groupByCategory(photos);

  if (dateGroups.size === 1) {
    const date = photos[0].dateTaken;
    return `${date} 的故事`;
  }

  if (locationGroups.size === 1 && photos[0].locationName) {
    return `${photos[0].locationName}之旅`;
  }

  const dominantCategory = [...categoryGroups.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  )[0];
  const categoryLabels: Record<string, string> = {
    person: '人物',
    landscape: '风景',
    food: '美食',
    pet: '萌宠',
    document: '文档',
    object: '生活',
    other: '日常',
  };
  if (dominantCategory && dominantCategory[0]) {
    const label = categoryLabels[dominantCategory[0]!] || '生活';
    return `${label}回忆`;
  }

  return '精彩瞬间';
}

function generateSubtitle(photos: Photo[]): string {
  const dateGroups = groupByDate(photos);
  const locationGroups = groupByLocation(photos);
  const locations = [...locationGroups.keys()].filter((k) => k !== 'unknown');

  if (dateGroups.size > 1 && locations.length > 0) {
    return `跨越 ${dateGroups.size} 天 · ${locations.length} 个地点 · ${photos.length} 张照片`;
  }
  if (dateGroups.size > 1) {
    return `跨越 ${dateGroups.size} 天 · ${photos.length} 张照片`;
  }
  if (locations.length > 1) {
    return `${locations.length} 个地点 · ${photos.length} 张照片`;
  }
  return `共 ${photos.length} 张照片`;
}

const MEMORY_TYPE_TITLES: Record<MemoryGroup['type'], string> = {
  'on-this-day': '那年今天',
  seasonal: '季节回忆',
  location: '地点故事',
  people: '人物故事',
};

const MEMORY_TYPE_MOODS: Record<MemoryGroup['type'], StoryMusicMood> = {
  'on-this-day': 'nostalgic',
  seasonal: 'calm',
  location: 'epic',
  people: 'nostalgic',
};

export class StoryGenerator implements IStoryGenerator {
  generateFromPhotos(photos: Photo[], options?: StoryGeneratorOptions): Story {
    const maxSlides = options?.maxSlides ?? 20;
    const layout = options?.layout ?? inferLayout(photos);
    const activePhotos = photos.filter((p) => !p.isDeleted);

    const slides = buildSlides(activePhotos, maxSlides);

    return {
      id: nextStoryId(),
      title: generateTitle(activePhotos),
      subtitle: generateSubtitle(activePhotos),
      coverPhotoId: selectCover(activePhotos),
      slides,
      layout,
      generatedAt: Date.now(),
      type: 'auto',
      musicMood: inferMusicMood(activePhotos),
    };
  }

  generateFromMemory(memory: MemoryGroup): Story {
    const activePhotos = memory.photos.filter((p) => !p.isDeleted);
    const slides = buildSlides(activePhotos, 15);
    const mood = MEMORY_TYPE_MOODS[memory.type];

    return {
      id: nextStoryId(),
      title: memory.title || MEMORY_TYPE_TITLES[memory.type],
      subtitle: memory.subtitle || memory.dateLabel,
      coverPhotoId: selectCover(activePhotos),
      slides,
      layout: 'cinematic',
      generatedAt: Date.now(),
      type: 'auto',
      musicMood: mood,
    };
  }

  generateFromAlbum(album: Album, photos: Photo[]): Story {
    const albumPhotos = photos
      .filter((p) => !p.isDeleted && album.photoIds.includes(p.id))
      .sort((a, b) => a.createdAt - b.createdAt);
    const layout = inferLayout(albumPhotos);
    const slides = buildSlides(albumPhotos, 20);

    return {
      id: nextStoryId(),
      title: album.name,
      subtitle: album.description || `${albumPhotos.length} 张照片`,
      coverPhotoId: selectCover(albumPhotos),
      slides,
      layout,
      generatedAt: Date.now(),
      type: album.isSmart ? 'auto' : 'manual',
      musicMood: inferMusicMood(albumPhotos),
    };
  }
}

let _instance: StoryGenerator | null = null;

export function getStoryGenerator(): StoryGenerator {
  if (!_instance) _instance = new StoryGenerator();
  return _instance;
}
