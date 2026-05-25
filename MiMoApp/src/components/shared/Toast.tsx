import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { useUiStore } from '../../store';
import { useAppTheme } from '../../theme';
import { LineIcon } from './LineIcon';
import type { ToastMessage } from '../../store';

function ToastItem({ toast }: { toast: ToastMessage }) {
  const { md3Theme: theme } = useAppTheme();
  const colors = (() => {
    switch (toast.type) {
      case 'success': return { bg: '#2E7D32', text: theme.colors.surfaceContainerLowest, icon: 'check-circle' };
      case 'error': return { bg: theme.colors.error, text: theme.colors.surfaceContainerLowest, icon: 'alert-circle' };
      case 'warning': return { bg: '#E65100', text: theme.colors.surfaceContainerLowest, icon: 'alert-triangle' };
      case 'info': default: return { bg: theme.colors.primary, text: theme.colors.surfaceContainerLowest, icon: 'info' };
    }
  })();
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 16, stiffness: 200, mass: 0.8 });
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 16, stiffness: 200, mass: 0.8 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: colors.bg, shadowColor: colors.bg },
        animStyle,
      ]}
    >
      <LineIcon name={colors.icon} size={16} color={colors.text} />
      <Text style={[styles.text, { color: colors.text }]}>{toast.text}</Text>
    </Animated.View>
  );
}

export function Toast() {
  const toasts = useUiStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 8,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  text: { fontSize: 14, fontWeight: '500' },
});
