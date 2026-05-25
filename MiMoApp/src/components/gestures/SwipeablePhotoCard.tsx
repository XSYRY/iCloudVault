import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useMd3Theme } from '../../theme';
import { LineIcon } from '../shared/LineIcon';
import { PhotoCard } from '../photo/PhotoCard';
import type { Photo } from '../../types';

interface SwipeablePhotoCardProps {
  photo: Photo;
  size: number;
  onPress: (photoId: string) => void;
  onFavorite: (photoId: string) => void;
  onDelete: (photoId: string) => void;
}

const SWIPE_THRESHOLD = 60;

export function SwipeablePhotoCard({
  photo,
  size,
  onPress,
  onFavorite,
  onDelete,
}: SwipeablePhotoCardProps) {
  const theme = useMd3Theme();
  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);

  const triggerFavorite = useCallback(() => {
    onFavorite(photo.id);
    translateX.value = 0;
  }, [onFavorite, photo.id, translateX]);

  const triggerDelete = useCallback(() => {
    onDelete(photo.id);
    translateX.value = 0;
  }, [onDelete, photo.id, translateX]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((event) => {
      translateX.value = contextX.value + event.translationX * 0.6;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(size, { damping: 18, stiffness: 120 }, (finished) => {
          if (finished) runOnJS(triggerFavorite)();
        });
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-size, { damping: 18, stiffness: 120 }, (finished) => {
          if (finished) runOnJS(triggerDelete)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 160 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[styles.wrapper, { width: size, height: size }]}>
        <View style={[styles.actionBg, styles.favBg, { backgroundColor: theme.colors.primaryContainer }]}>
          <LineIcon name="heart" size={24} color={theme.colors.primary} fill={theme.colors.primary} />
        </View>

        <View style={[styles.actionBg, styles.delBg, { backgroundColor: theme.colors.errorContainer }]}>
          <LineIcon name="trash" size={24} color={theme.colors.error} />
        </View>

        <Animated.View style={animatedStyle}>
          <PhotoCard photo={photo} size={size} onPress={onPress} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', overflow: 'hidden', borderRadius: 12 },
  actionBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  favBg: { left: 0, paddingRight: '60%' as any },
  delBg: { right: 0, paddingLeft: '60%' as any },
});
