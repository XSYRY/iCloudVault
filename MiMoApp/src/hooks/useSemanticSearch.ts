import { useCallback, useMemo, useRef } from 'react';
import { usePhotoStore, useSettingsStore } from '../store';
import { searchIndex } from '../ai/searchIndex';
import { parseIntent } from '../ai/nlu/parser';
import type { Photo } from '../types';

interface ScoredPhoto {
  photo: Photo;
  score: number;
}

export function useSemanticSearch() {
  const photos = usePhotoStore((s) => s.photos);
  const addSearchHistory = useSettingsStore((s) => s.addSearchHistory);
  const indexBuilt = useRef(false);

  const activePhotos = useMemo(() => photos.filter((p) => !p.isDeleted), [photos]);

  useMemo(() => {
    if (activePhotos.length > 0) {
      searchIndex.build(activePhotos);
      indexBuilt.current = true;
    }
  }, [activePhotos]);

  const search = useCallback(
    (query: string): Photo[] => {
      if (!query.trim()) return [];
      addSearchHistory(query);

      const intent = parseIntent(query);
      const q = query.toLowerCase();

      const scored: ScoredPhoto[] = [];

      for (const p of activePhotos) {
        let score = 0;

        if (p.filename.toLowerCase().includes(q)) score += 3;
        if (p.aiTags?.some((t) => t.toLowerCase().includes(q))) score += 5;
        if (p.locationName?.toLowerCase().includes(q)) score += 4;
        if (p.dateTaken.includes(q)) score += 2;

        if (intent.time) {
          if (intent.time.match(/^\d{4}$/) && p.dateTaken.startsWith(intent.time)) score += 8;
          if (intent.time.match(/^\d{1,2}月$/) && p.dateTaken.includes(`-${intent.time.replace('月', '').padStart(2, '0')}-`)) score += 8;
        }

        if (intent.location && p.locationName?.includes(intent.location)) score += 6;

        if (intent.keyword) {
          if (p.aiTags?.some((t) => t.includes(intent.keyword!))) score += 7;
          if (p.filename.toLowerCase().includes(intent.keyword!.toLowerCase())) score += 3;
        }

        if (intent.category) {
          if (p.aiCategory === intent.category) score += 9;
          if (p.aiTags?.some((t) => t.includes(intent.category!))) score += 4;
        }

        if (score > 0) {
          scored.push({ photo: p, score });
        }
      }

      if (scored.length === 0 && indexBuilt.current) {
        const indexResults = searchIndex.searchAny(query);
        return indexResults.sort((a, b) => b.createdAt - a.createdAt);
      }

      return scored
        .sort((a, b) => b.score - a.score || b.photo.createdAt - a.photo.createdAt)
        .map((s) => s.photo);
    },
    [activePhotos, addSearchHistory],
  );

  const suggest = useCallback(
    (query: string): string[] => {
      if (!query.trim() || !indexBuilt.current) return [];
      const results = searchIndex.searchAny(query);
      const tags = new Set<string>();
      for (const p of results.slice(0, 10)) {
        if (p.aiTags) {
          for (const t of p.aiTags) tags.add(t);
        }
        if (p.locationName) tags.add(p.locationName);
        if (p.aiCategory) tags.add(p.aiCategory);
      }
      return Array.from(tags)
        .filter((t) => t.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8);
    },
    [],
  );

  return { search, suggest };
}
