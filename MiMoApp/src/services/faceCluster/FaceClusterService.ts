import type { Photo } from '../../types';

export interface FaceGroup {
  id: string;
  name: string;
  coverPhotoId: string;
  coverUri: string;
  photoIds: string[];
  photoCount: number;
  createdAt: number;
}

export interface IFaceClusterService {
  cluster(photos: Photo[]): FaceGroup[];
  renameGroup(groupId: string, name: string): void;
  mergeGroups(groupIds: string[]): FaceGroup | null;
  splitGroup(groupId: string, photoIds: string[]): FaceGroup[];
}

let groupSeq = 0;
function nextGroupId(): string {
  return `facegroup-${++groupSeq}`;
}

export class FaceClusterService implements IFaceClusterService {
  private groups: FaceGroup[] = [];

  cluster(photos: Photo[]): FaceGroup[] {
    const withFaces = photos.filter(
      (p) => !p.isDeleted && p.faceCount != null && p.faceCount > 0,
    );

    if (withFaces.length === 0) {
      this.groups = [];
      return [];
    }

    const groups = new Map<string, Photo[]>();

    for (const photo of withFaces) {
      const key = this.computeClusterKey(photo);
      const arr = groups.get(key) || [];
      arr.push(photo);
      groups.set(key, arr);
    }

    this.groups = Array.from(groups.entries()).map(([, groupPhotos]) => {
      const sorted = groupPhotos.sort((a, b) => b.createdAt - a.createdAt);
      const cover = sorted[0];
      return {
        id: nextGroupId(),
        name: '',
        coverPhotoId: cover.id,
        coverUri: cover.thumbnailUri || cover.uri,
        photoIds: sorted.map((p) => p.id),
        photoCount: sorted.length,
        createdAt: cover.createdAt,
      };
    });

    this.groups.sort((a, b) => b.photoCount - a.photoCount);

    return this.groups;
  }

  getGroups(): FaceGroup[] {
    return this.groups;
  }

  getGroupById(id: string): FaceGroup | undefined {
    return this.groups.find((g) => g.id === id);
  }

  renameGroup(groupId: string, name: string): void {
    const group = this.groups.find((g) => g.id === groupId);
    if (group) group.name = name;
  }

  mergeGroups(groupIds: string[]): FaceGroup | null {
    const toMerge = this.groups.filter((g) => groupIds.includes(g.id));
    if (toMerge.length < 2) return null;

    const allPhotoIds = toMerge.flatMap((g) => g.photoIds);
    const bestCover = toMerge.sort((a, b) => b.photoCount - a.photoCount)[0];

    const merged: FaceGroup = {
      id: nextGroupId(),
      name: toMerge.find((g) => g.name)?.name || '',
      coverPhotoId: bestCover.coverPhotoId,
      coverUri: bestCover.coverUri,
      photoIds: [...new Set(allPhotoIds)],
      photoCount: allPhotoIds.length,
      createdAt: Math.min(...toMerge.map((g) => g.createdAt)),
    };

    this.groups = this.groups.filter((g) => !groupIds.includes(g.id));
    this.groups.unshift(merged);

    return merged;
  }

  splitGroup(groupId: string, photoIds: string[]): FaceGroup[] {
    const original = this.groups.find((g) => g.id === groupId);
    if (!original) return [];

    const remaining = original.photoIds.filter((id) => !photoIds.includes(id));

    const newGroup: FaceGroup = {
      id: nextGroupId(),
      name: '',
      coverPhotoId: photoIds[0],
      coverUri: '',
      photoIds,
      photoCount: photoIds.length,
      createdAt: Date.now(),
    };

    original.photoIds = remaining;
    original.photoCount = remaining.length;

    this.groups.push(newGroup);

    return [original, newGroup];
  }

  private computeClusterKey(photo: Photo): string {
    const parts: string[] = [];

    if (photo.aiCategory === 'person') {
      parts.push('person');
    }

    if (photo.locationName) {
      parts.push(photo.locationName.slice(0, 4));
    }

    const month = photo.dateTaken.slice(0, 7);
    parts.push(month);

    if (photo.faceCount != null) {
      if (photo.faceCount === 1) parts.push('solo');
      else if (photo.faceCount === 2) parts.push('duo');
      else parts.push('group');
    }

    return parts.join('|');
  }
}

let _instance: FaceClusterService | null = null;

export function getFaceClusterService(): FaceClusterService {
  if (!_instance) _instance = new FaceClusterService();
  return _instance;
}
