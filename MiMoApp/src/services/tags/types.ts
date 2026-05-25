export interface TagInfo {
  name: string;
  count: number;
  category?: string;
  lastUsed: number;
}

export interface ITagService {
  getAllTags(): TagInfo[];
  addTag(photoId: string, tag: string): void;
  removeTag(photoId: string, tag: string): void;
  renameTag(oldName: string, newName: string): void;
  mergeTags(sourceTag: string, targetTag: string): void;
  deleteTag(tag: string): void;
  getPhotosByTag(tag: string): string[];
  getTagSuggestions(prefix: string): TagInfo[];
  getPopularTags(limit?: number): TagInfo[];
}
