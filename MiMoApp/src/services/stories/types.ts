import type { Photo, Album } from '../../types';
import type { MemoryGroup } from '../memories';

export type StoryLayout = 'magazine' | 'cinematic' | 'grid' | 'timeline';

export type StoryTransition = 'fade' | 'slide' | 'zoom' | 'none';

export type StoryMusicMood = 'upbeat' | 'calm' | 'nostalgic' | 'epic';

export interface StorySlide {
  photoId: string;
  caption?: string;
  duration: number;
  transition: StoryTransition;
}

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  coverPhotoId: string;
  slides: StorySlide[];
  layout: StoryLayout;
  generatedAt: number;
  type: 'auto' | 'manual';
  musicMood?: StoryMusicMood;
}

export interface StoryGeneratorOptions {
  layout?: StoryLayout;
  maxSlides?: number;
}

export interface IStoryGenerator {
  generateFromPhotos(photos: Photo[], options?: StoryGeneratorOptions): Story;
  generateFromMemory(memory: MemoryGroup): Story;
  generateFromAlbum(album: Album, photos: Photo[]): Story;
}
