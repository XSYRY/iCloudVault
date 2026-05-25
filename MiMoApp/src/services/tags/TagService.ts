import { usePhotoStore } from '../../store';
import type { TagInfo, ITagService } from './types';

export class TagService implements ITagService {
  getAllTags(): TagInfo[] {
    const photos = usePhotoStore.getState().photos;
    const tagMap = new Map<string, { count: number; lastUsed: number }>();

    for (const photo of photos) {
      if (photo.isDeleted || !photo.aiTags) continue;
      for (const tag of photo.aiTags) {
        const existing = tagMap.get(tag);
        if (existing) {
          existing.count += 1;
          if (photo.createdAt > existing.lastUsed) {
            existing.lastUsed = photo.createdAt;
          }
        } else {
          tagMap.set(tag, { count: 1, lastUsed: photo.createdAt });
        }
      }
    }

    return Array.from(tagMap.entries())
      .map(([name, { count, lastUsed }]) => ({ name, count, lastUsed }))
      .sort((a, b) => b.count - a.count);
  }

  addTag(photoId: string, tag: string): void {
    const photo = usePhotoStore.getState().getPhotoById(photoId);
    if (!photo) return;
    const tags = photo.aiTags ? [...photo.aiTags] : [];
    if (tags.includes(tag)) return;
    tags.push(tag);
    usePhotoStore.getState().updatePhoto(photoId, { aiTags: tags });
  }

  removeTag(photoId: string, tag: string): void {
    const photo = usePhotoStore.getState().getPhotoById(photoId);
    if (!photo || !photo.aiTags) return;
    const tags = photo.aiTags.filter((t) => t !== tag);
    usePhotoStore.getState().updatePhoto(photoId, { aiTags: tags.length > 0 ? tags : null });
  }

  renameTag(oldName: string, newName: string): void {
    const { photos } = usePhotoStore.getState();
    for (const photo of photos) {
      if (!photo.aiTags || !photo.aiTags.includes(oldName)) continue;
      const tags = photo.aiTags.map((t) => (t === oldName ? newName : t));
      usePhotoStore.getState().updatePhoto(photo.id, { aiTags: tags });
    }
  }

  mergeTags(sourceTag: string, targetTag: string): void {
    const { photos } = usePhotoStore.getState();
    for (const photo of photos) {
      if (!photo.aiTags || !photo.aiTags.includes(sourceTag)) continue;
      const tags = photo.aiTags.filter((t) => t !== sourceTag);
      if (!tags.includes(targetTag)) {
        tags.push(targetTag);
      }
      usePhotoStore.getState().updatePhoto(photo.id, { aiTags: tags });
    }
  }

  deleteTag(tag: string): void {
    const { photos } = usePhotoStore.getState();
    for (const photo of photos) {
      if (!photo.aiTags || !photo.aiTags.includes(tag)) continue;
      const tags = photo.aiTags.filter((t) => t !== tag);
      usePhotoStore.getState().updatePhoto(photo.id, { aiTags: tags.length > 0 ? tags : null });
    }
  }

  getPhotosByTag(tag: string): string[] {
    const { photos } = usePhotoStore.getState();
    return photos
      .filter((p) => !p.isDeleted && p.aiTags && p.aiTags.includes(tag))
      .map((p) => p.id);
  }

  getTagSuggestions(prefix: string): TagInfo[] {
    const lower = prefix.toLowerCase();
    return this.getAllTags()
      .filter((t) => t.name.toLowerCase().startsWith(lower))
      .sort((a, b) => b.count - a.count);
  }

  getPopularTags(limit: number = 20): TagInfo[] {
    return this.getAllTags().slice(0, limit);
  }
}

let _instance: TagService | null = null;

export function getTagService(): TagService {
  if (!_instance) _instance = new TagService();
  return _instance;
}
