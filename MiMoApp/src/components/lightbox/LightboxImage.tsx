import React, { useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useMd3Theme } from '../../theme';

// ============================================================
// LightboxImage — 单张图片的捏合缩放 + 双击放大 + 拖拽关闭
// 接口：uri, onRequestClose, onTap
// ============================================================

interface LightboxImageProps {
  id: string;
  uri: string;
  color: string;
  onTap: () => void;
  onRequestClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
const SWIPE_CLOSE_THRESHOLD = 0.3;
const SWIPE_NAV_THRESHOLD = 0.25;

export function LightboxImage({ id, uri, color, onTap, onRequestClose, onPrev, onNext }: LightboxImageProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const theme = useMd3Theme();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // ---- 双击放大/还原 ----
  const handleDoubleTap = useCallback(
    (x: number, y: number) => {
      'worklet';
      if (scale.value > 1.2) {
        // 还原
        scale.value = withTiming(1, { duration: 250 });
        translateX.value = withTiming(0, { duration: 250 });
        translateY.value = withTiming(0, { duration: 250 });
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // 放大到屏幕中心
        const cx = (x - screenWidth / 2) * (1 - DOUBLE_TAP_SCALE);
        const cy = (y - screenHeight / 2) * (1 - DOUBLE_TAP_SCALE);
        scale.value = withTiming(DOUBLE_TAP_SCALE, { duration: 250 });
        translateX.value = withTiming(cx, { duration: 250 });
        translateY.value = withTiming(cy, { duration: 250 });
        savedScale.value = DOUBLE_TAP_SCALE;
        savedTranslateX.value = cx;
        savedTranslateY.value = cy;
      }
    },
    [screenWidth, screenHeight],
  );

  // ---- 捏合手势 ----
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      const nextScale = Math.min(Math.max(savedScale.value * event.scale, 0.5), MAX_SCALE);
      scale.value = nextScale;

      const fx = event.focalX - screenWidth / 2;
      const fy = event.focalY - screenHeight / 2;
      translateX.value = savedTranslateX.value + fx * (1 - nextScale / savedScale.value);
      translateY.value = savedTranslateY.value + fy * (1 - nextScale / savedScale.value);
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1, { duration: 200 });
        translateX.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
        savedScale.value = 1;
      }
    });

  // ---- 拖拽手势（缩放 > 1 时平移，缩放 = 1 时下拉关闭）----
  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      } else {
        // 下拉关闭
        translateY.value = event.translationY * 0.5;
        translateX.value = event.translationX * 0.5;
      }
    })
    .onEnd((event) => {
      if (scale.value <= 1) {
        if (Math.abs(event.translationY) > screenHeight * SWIPE_CLOSE_THRESHOLD) {
          runOnJS(onRequestClose)();
          return;
        }
        if (Math.abs(event.translationX) > screenWidth * SWIPE_NAV_THRESHOLD) {
          if (event.translationX < 0 && onNext) {
            runOnJS(onNext)();
          } else if (event.translationX > 0 && onPrev) {
            runOnJS(onPrev)();
          }
          translateX.value = withTiming(0, { duration: 200 });
          translateY.value = withTiming(0, { duration: 200 });
          return;
        }
      }
      translateX.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
    });

  // ---- 双击手势 ----
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      runOnJS(handleDoubleTap)(event.x, event.y);
    });

  // ---- 单击手势 ----
  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      runOnJS(onTap)();
    });

  const gestures = Gesture.Simultaneous(pinchGesture, panGesture);
  const allGestures = Gesture.Exclusive(doubleTapGesture, singleTapGesture, gestures);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={allGestures}>
      <Animated.View style={[styles.container, { width: screenWidth, height: screenHeight }]}>
        <Animated.View style={animatedStyle} sharedTransitionTag={`photo-${id}`}>
          <Image
            source={{ uri }}
            style={[
              styles.image,
              { width: screenWidth, height: screenHeight * 0.7 },
            ]}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    // dimensions set inline
  },
});
