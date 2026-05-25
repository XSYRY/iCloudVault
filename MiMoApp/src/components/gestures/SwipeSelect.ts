import { useCallback, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { usePhotoStore } from '../../store';
import { hapticSelection } from '../../services/haptics';

interface CardLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const HAPTIC_THROTTLE_MS = 80;

export function useSwipeSelect() {
  const selectionMode = usePhotoStore((s) => s.selectionMode);
  const toggleSelection = usePhotoStore((s) => s.toggleSelection);
  const cardLayouts = useRef<CardLayout[]>([]);
  const lastSelectedId = useRef<string | null>(null);
  const lastHapticTime = useRef(0);

  const registerLayout = useCallback((id: string, x: number, y: number, width: number, height: number) => {
    const layouts = cardLayouts.current;
    const idx = layouts.findIndex((l) => l.id === id);
    const entry: CardLayout = { id, x, y, width, height };
    if (idx >= 0) {
      layouts[idx] = entry;
    } else {
      layouts.push(entry);
    }
  }, []);

  const clearLayouts = useCallback(() => {
    cardLayouts.current = [];
  }, []);

  const hitTest = (x: number, y: number): string | null => {
    const layouts = cardLayouts.current;
    for (let i = layouts.length - 1; i >= 0; i--) {
      const card = layouts[i];
      if (
        x >= card.x && x <= card.x + card.width &&
        y >= card.y && y <= card.y + card.height
      ) {
        return card.id;
      }
    }
    return null;
  };

  const handleHit = (id: string | null) => {
    if (id && id !== lastSelectedId.current) {
      lastSelectedId.current = id;
      toggleSelection(id);
      const now = Date.now();
      if (now - lastHapticTime.current >= HAPTIC_THROTTLE_MS) {
        lastHapticTime.current = now;
        hapticSelection();
      }
    }
  };

  const gesture = Gesture.Pan()
    .enabled(selectionMode)
    .minDistance(5)
    .onUpdate((event) => {
      const hitId = hitTest(event.x, event.y);
      if (hitId) {
        runOnJS(handleHit)(hitId);
      }
    })
    .onEnd(() => {
      lastSelectedId.current = null;
    });

  return { gesture, registerLayout, clearLayouts, toggleSelection };
}
