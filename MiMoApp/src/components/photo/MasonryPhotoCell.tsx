import React, { memo } from 'react';
import { Pressable, Image, View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useAppTheme } from '../../theme';
import { LineIcon } from '../shared/LineIcon';
import { hapticMedium } from '../../services/haptics';
import { VideoIndicator } from './VideoIndicator';
import type { Photo } from '../../types';

const GAP = 2;

interface MasonryPhotoCellProps {
  photo: Photo;
  width: number;
  height: number;
  selectionMode: boolean;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export const MasonryPhotoCell = memo(function MasonryPhotoCell({
  photo,
  width,
  height,
  selectionMode,
  isSelected,
  onPress,
  onLongPress,
}: MasonryPhotoCellProps) {
  const { md3Theme: theme } = useAppTheme();
  const opacity = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const cellWidth = width - GAP;
  const cellHeight = height - GAP;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={() => { hapticMedium(); onLongPress(); }}
      style={[
        styles.wrap,
        {
          width: cellWidth,
          height: cellHeight,
          backgroundColor: photo.color || theme.colors.surfaceVariant,
        },
        isSelected && { opacity: 0.7 },
      ]}
    >
      <Animated.View pointerEvents="none" style={[animatedStyle, { width: cellWidth, height: cellHeight }]}>
        <Image
          source={{ uri: photo.thumbnailUri || photo.uri, cache: 'force-cache' }}
          style={{ width: cellWidth, height: cellHeight }}
          resizeMode="cover"
          onLoad={() => {
            opacity.value = withTiming(1, { duration: 350 });
          }}
        />
      </Animated.View>

      {selectionMode && (
        <View style={[styles.checkCircle, { borderColor: theme.colors.surfaceContainerLowest }]}>
          <View
            style={[
              styles.checkInner,
              isSelected && { backgroundColor: theme.colors.onSurface },
            ]}
          />
        </View>
      )}

      {photo.isFavorite && !selectionMode && (
        <View style={[styles.favBadge, { backgroundColor: theme.colors.primary + '99' }]}>
          <LineIcon name="heart" size={12} color={theme.colors.surfaceContainerLowest} />
        </View>
      )}

      {photo.mediaType === 'video' && !selectionMode && (
        <VideoIndicator duration={photo.duration} />
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderRadius: 4,
    margin: GAP / 2,
  },
  checkCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  checkInner: { width: 14, height: 14, borderRadius: 7 },
  favBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});
