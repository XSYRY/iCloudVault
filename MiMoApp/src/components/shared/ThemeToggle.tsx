import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useMd3Theme } from '../../theme';
import { LineIcon } from './LineIcon';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  const theme = useMd3Theme();
  const rotateAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: isDark ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [isDark]);

  const translateX = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 24],
  });

  const backgroundColor = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.surfaceContainerHighest, theme.colors.inverseSurface],
  });

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
      <Animated.View style={[styles.container, { backgroundColor }]}>
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: theme.colors.surfaceContainerLowest },
            { transform: [{ translateX }] },
          ]}
        >
          <LineIcon name={isDark ? 'moon' : 'sun'} size={16} color={theme.colors.onSurface} />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

interface ThemeTransitionProps {
  children: React.ReactNode;
  isDark: boolean;
}

export function ThemeTransition({ children, isDark }: ThemeTransitionProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isDark]);

  return (
    <Animated.View style={[styles.fullScreen, { opacity: fadeAnim }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 56,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fullScreen: {
    flex: 1,
  },
});
