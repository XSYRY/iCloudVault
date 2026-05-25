import { useEffect, useState } from 'react';
import { usePhotoStore, useSettingsStore } from '../store';
import { generateMockPhotos } from '../utils/mockData';

export function useAppInit(): boolean {
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const isHydrated = useSettingsStore((s) => s.isHydrated);
  const setPhotos = usePhotoStore((s) => s.setPhotos);
  const hydrateFromDb = usePhotoStore((s) => s.hydrateFromDb);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await Promise.race([
          loadSettings(),
          new Promise<void>((r) => setTimeout(r, 2000)),
        ]);
      } catch {
        useSettingsStore.setState({ isHydrated: true });
      }

      if (!cancelled) setReady(true);

      try {
        await Promise.race([
          hydrateFromDb(),
          new Promise<void>((r) => setTimeout(r, 5000)),
        ]);
      } catch {
        // hydrate failed
      }

      usePhotoStore.setState({ isHydrated: true, isGridReady: true });

      if (!cancelled) {
        const currentPhotos = usePhotoStore.getState().photos;
        if (currentPhotos.length === 0) {
          setPhotos(generateMockPhotos());
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  return ready && isHydrated;
}
