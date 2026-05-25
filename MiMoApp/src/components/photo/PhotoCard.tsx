import React, { memo, useRef, useCallback, useEffect } from 'react';
import { View, Image, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useAppTheme } from '../../theme';
import { LineIcon } from '../shared/LineIcon';
import { hapticMedium } from '../../services/haptics';
import type { Photo } from '../../types';
import { VideoIndicator } from './VideoIndicator';
import { LivePhotoBadge } from './LivePhotoBadge';

interface PhotoCardProps {
  photo: Photo;
  size: number;
  index?: number;
  selected?: boolean;
  selectMode?: boolean;
  onPress: (photoId: string) => void;
  onLongPress?: (photoId: string) => void;
}

const SPRING_PRESS = { damping: 14, stiffness: 240, mass: 0.6 };

export const PhotoCard = memo(function PhotoCard({
  photo,
  size,
  index = 0,
  selected,
  selectMode,
  onPress,
  onLongPress,
}: PhotoCardProps) {
  const { md3Theme: theme, tokens } = useAppTheme();
  const opacity = useSharedValue(0);
  const cardScale = useSharedValue(0.95);
  const pressScale = useSharedValue(1);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      opacity.value = withTiming(1, { duration: 180 });
      cardScale.value = withTiming(1, { duration: 180 });
    }
  }, []);

  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(0.96, SPRING_PRESS);
  }, []);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, SPRING_PRESS);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: cardScale.value * pressScale.value }],
  }));

  return (
    <Animated.View style={animatedStyle} sharedTransitionTag={`photo-${photo.id}`}>
      <Pressable
        onPress={() => onPress(photo.id)}
        onLongPress={() => { hapticMedium(); onLongPress?.(photo.id); }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible
        accessibilityLabel={`${photo.filename}，${photo.dateTaken}`}
        accessibilityHint="点击查看大图，长按选择照片"
        accessibilityRole="image"
        accessibilityState={{ selected: selected || false }}
        style={[
          styles.container,
          {
            width: size,
            height: size,
            backgroundColor: photo.color || theme.colors.surfaceVariant,
          },
        ]}
      >
        <View style={[styles.placeholder, { backgroundColor: photo.color || theme.colors.surfaceVariant }]} />

        {photo.thumbnailUri ? (
          <Image
            source={{ 
              uri: photo.thumbnailUri,
              cache: 'force-cache',
            }}
            style={[styles.image]}
            resizeMode="cover"
            fadeDuration={150}
          />
        ) : (
          <View style={[styles.fallback, { backgroundColor: photo.color || theme.colors.surfaceVariant }]}>
            <LineIcon name="photo" size={24} color={theme.colors.onSurface + '33'} />
          </View>
        )}

        {photo.mediaType === 'video' && !selectMode && (
          <VideoIndicator duration={photo.duration} />
        )}

        {photo.mediaType === 'live' && !selectMode && (
          <LivePhotoBadge />
        )}

        {photo.isFavorite && !selectMode && (
          <View style={styles.favBadge}>
            <LineIcon name="heart-filled" size={14} color={theme.colors.error} />
          </View>
        )}

        {photo.aiTags && photo.aiTags.length > 0 && !selectMode && (
          <View style={[styles.tagBadge, { backgroundColor: theme.colors.primary + 'A6' }]}>
            <Text style={[styles.tagBadgeText, { color: theme.colors.surfaceContainerLowest }]}>{photo.aiTags[0]}</Text>
          </View>
        )}

        {selectMode && (
          <View style={[styles.checkMark, selected ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.surfaceContainerLowest + 'D9', borderWidth: 2, borderColor: theme.colors.primary }]}>
            {selected && <LineIcon name="check" size={20} color={theme.colors.onPrimary} />}
          </View>
        )}

        {selected && !selectMode && (
          <View style={[styles.selectedOutline, { borderColor: theme.colors.primary }]} />
        )}
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: { 
    overflow: 'hidden',
    borderRadius: 24,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  image: { 
    width: '100%', 
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  placeholder: { 
    width: '100%', 
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    zIndex: 5,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  favBadge: { 
    position: 'absolute', 
    bottom: 8,
    left: 8,
    zIndex: 5,
  },
  checkMark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  selectedOutline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderRadius: 24,
    borderStyle: 'solid',
    zIndex: 5,
  },
});
