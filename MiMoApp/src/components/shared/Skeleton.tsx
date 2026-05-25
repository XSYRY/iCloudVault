import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useAppTheme } from '../../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const { md3Theme: theme } = useAppTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceVariant,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
            backgroundColor: theme.colors.surfaceContainerLowest + '66',
          },
        ]}
      />
    </View>
  );
}

interface PhotoSkeletonGridProps {
  columns?: number;
  rows?: number;
  gap?: number;
}

export function PhotoSkeletonGrid({
  columns = 3,
  rows = 6,
  gap = 2,
}: PhotoSkeletonGridProps) {
  const skeletons = [];
  for (let i = 0; i < columns * rows; i++) {
    skeletons.push(<Skeleton key={i} style={{ margin: gap / 2 }} />);
  }
  return <View style={[styles.grid, { gap }]}>{skeletons}</View>;
}

interface CardSkeletonProps {
  style?: any;
}

export function CardSkeleton({ style }: CardSkeletonProps) {
  const { md3Theme: theme } = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }, style]}>
      <Skeleton height={120} borderRadius={16} />
      <View style={styles.cardContent}>
        <Skeleton width="60%" height={16} style={{ marginTop: 8 }} />
        <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardContent: {
    paddingTop: 8,
  },
});
