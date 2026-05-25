import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useMd3Theme } from '../../theme';

interface AppLoaderProps {
  visible: boolean;
  onLoadComplete?: () => void;
}

export function AppLoader({ visible, onLoadComplete }: AppLoaderProps) {
  const theme = useMd3Theme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );

      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          setTimeout(() => {
            onLoadComplete?.();
          }, 300);
        }
        setProgress(currentProgress);
      }, 200);
    }
  }, [visible]);

  if (!visible) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor: theme.colors.surface }]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            { backgroundColor: theme.colors.surfaceContainerHighest },
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Animated.Text
            style={[styles.logo, { transform: [{ rotate: spin }] }]}
          >
            🔐
          </Animated.Text>
        </Animated.View>

        <Text style={[styles.appName, { color: theme.colors.onSurface }]}>Momento 相册</Text>
        <Text style={[styles.tagline, { color: theme.colors.onSurfaceVariant }]}>安全 · 私密 · 智能</Text>

        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceContainerHighest }]}>
            <Animated.View
              style={[styles.progressFill, { backgroundColor: theme.colors.onSurface, width: `${progress}%` }]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  logo: {
    fontSize: 64,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    marginBottom: 48,
    letterSpacing: 0.5,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
