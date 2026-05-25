import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

type HapticMethod =
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError'
  | 'selection';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const OPTIONS = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const TYPE_MAP: Record<HapticType, HapticMethod> = {
  light: 'impactLight',
  medium: 'impactMedium',
  heavy: 'impactHeavy',
  success: 'notificationSuccess',
  warning: 'notificationWarning',
  error: 'notificationError',
  selection: 'selection',
};

export function triggerHaptic(type: HapticType = 'light'): void {
  const method = TYPE_MAP[type] ?? 'impactLight';
  ReactNativeHapticFeedback.trigger(method, OPTIONS);
}

export function hapticSuccess(): void {
  triggerHaptic('success');
}

export function hapticWarning(): void {
  triggerHaptic('warning');
}

export function hapticError(): void {
  triggerHaptic('error');
}

export function hapticSelection(): void {
  triggerHaptic('selection');
}

export function hapticLight(): void {
  triggerHaptic('light');
}

export function hapticMedium(): void {
  triggerHaptic('medium');
}

export function hapticHeavy(): void {
  triggerHaptic('heavy');
}
