import type { AccessibilityRole, AccessibilityState } from 'react-native';

export function getPhotoCardAccessibility(filename: string, dateTaken: string, isFavorite: boolean, isSelected: boolean) {
  return {
    accessible: true as const,
    accessibilityLabel: `照片 ${filename}，拍摄于 ${dateTaken}${isFavorite ? '，已收藏' : ''}`,
    accessibilityHint: '双击查看大图，长按选择照片',
    accessibilityRole: 'image' as AccessibilityRole,
    accessibilityState: { selected: isSelected } as AccessibilityState,
  };
}

export function getButtonAccessibility(label: string, hint?: string, disabled?: boolean) {
  return {
    accessible: true as const,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: 'button' as AccessibilityRole,
    accessibilityState: { disabled } as AccessibilityState,
  };
}

export function getHeaderAccessibility(title: string) {
  return {
    accessible: true as const,
    accessibilityLabel: title,
    accessibilityRole: 'header' as AccessibilityRole,
  };
}

export function getListAccessibility(label: string, count?: number) {
  return {
    accessible: true as const,
    accessibilityLabel: count ? `${label}，共 ${count} 项` : label,
    accessibilityRole: 'list' as AccessibilityRole,
  };
}

export function getTabAccessibility(label: string, isSelected: boolean) {
  return {
    accessible: true as const,
    accessibilityLabel: label,
    accessibilityRole: 'tab' as AccessibilityRole,
    accessibilityState: { selected: isSelected } as AccessibilityState,
  };
}
