import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { LineIcon } from '../shared/LineIcon';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  action,
}: ToastProps) {
  const { md3Theme: theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return theme.colors.error;
      case 'warning':
        return '#FF9800';
      case 'info':
      default:
        return theme.colors.inverseSurface;
    }
  };

  const getIconColor = () => {
    return theme.colors.inverseOnSurface;
  };

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'check';
      case 'error':
        return 'close';
      case 'warning':
        return 'info';
      case 'info':
      default:
        return 'info';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 16,
          backgroundColor: getBackgroundColor(),
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.content}>
        <LineIcon name={getIconName()} size={16} color={getIconColor()} />
        <Text style={[styles.message, { color: theme.colors.surfaceContainerLowest }]}>{message}</Text>
        {action && (
          <Pressable onPress={action.onPress} style={styles.actionButton}>
            <Text style={[styles.actionLabel, { color: theme.colors.surfaceContainerLowest }]}>{action.label}</Text>
          </Pressable>
        )}
        <Pressable onPress={handleDismiss} style={styles.closeButton}>
          <LineIcon name="close" size={14} color={getIconColor()} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

interface ToastContainerProps {
  children: React.ReactNode;
}

export function ToastContainer({ children }: ToastContainerProps) {
  return <View style={styles.toastContainer}>{children}</View>;
}

const styles = StyleSheet.create({
  toastContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    pointerEvents: 'box-none',
  },
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 0,
    zIndex: 99999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    fontSize: 18,
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 999,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
  closeIcon: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
