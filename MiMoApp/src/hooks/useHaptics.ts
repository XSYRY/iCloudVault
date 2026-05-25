import { useCallback } from 'react';
import { triggerHaptic, type HapticType } from '../services/haptics';

export type { HapticType };

interface HapticsAPI {
  trigger: (type?: HapticType) => void;
  success: () => void;
  error: () => void;
  selection: () => void;
  light: () => void;
  medium: () => void;
  heavy: () => void;
}

export function useHaptics(): HapticsAPI {
  const trigger = useCallback((type: HapticType = 'light') => {
    triggerHaptic(type);
  }, []);

  const success = useCallback(() => triggerHaptic('success'), []);
  const error = useCallback(() => triggerHaptic('error'), []);
  const selection = useCallback(() => triggerHaptic('selection'), []);
  const light = useCallback(() => triggerHaptic('light'), []);
  const medium = useCallback(() => triggerHaptic('medium'), []);
  const heavy = useCallback(() => triggerHaptic('heavy'), []);

  return { trigger, success, error, selection, light, medium, heavy };
}
