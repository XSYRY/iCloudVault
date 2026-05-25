import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  GestureResponderEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMd3Theme } from '../theme';
import { usePhotoStore, useUiStore } from '../store';
import type { Photo } from '../types';
import type { Story, StorySlide } from '../services/stories';
import type { RootStackScreenProps } from '../navigation/types';

const PROGRESS_BAR_HEIGHT = 3;

export function StoryViewerScreen({ route, navigation }: RootStackScreenProps<'StoryViewer'>) {
  const { storyId } = route.params;
  const theme = useMd3Theme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const photos = usePhotoStore((s) => s.photos);

  const story = useUiStore((s) => s.getStory(storyId));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const progressValue = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slides: StorySlide[] = story?.slides || [];

  const photoMap = useMemo(() => {
    const map = new Map<string, Photo>();
    for (const p of photos) map.set(p.id, p);
    return map;
  }, [photos]);

  const currentSlide = slides[currentIndex] ?? null;
  const currentPhoto = currentSlide ? photoMap.get(currentSlide.photoId) ?? null : null;

  const goToSlide = useCallback(
    (index: number) => {
      if (index < 0 || index >= slides.length) {
        navigation.goBack();
        return;
      }
      progressValue.value = 0;
      setCurrentIndex(index);
    },
    [slides.length, navigation, progressValue],
  );

  const goNext = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const goPrev = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  useEffect(() => {
    if (!isPlaying || !currentSlide) return;

    progressValue.value = 0;
    progressValue.value = withTiming(1, {
      duration: currentSlide.duration,
      easing: Easing.linear,
    }, (finished) => {
      if (finished) {
        runOnJS(goNext)();
      }
    });

    return () => {
      progressValue.value = 0;
    };
  }, [currentIndex, isPlaying, currentSlide, progressValue, goNext]);

  const handleTap = useCallback(
    (e: GestureResponderEvent) => {
      const x = e.nativeEvent.locationX;
      if (x < screenWidth * 0.3) {
        goPrev();
      } else if (x > screenWidth * 0.7) {
        goNext();
      } else {
        setIsPlaying((prev) => !prev);
      }
    },
    [screenWidth, goPrev, goNext],
  );

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const transitionKey = `${currentIndex}-${currentSlide?.transition || 'none'}`;

  const renderSlide = () => {
    if (!currentPhoto) return null;

    const entering =
      currentSlide?.transition === 'fade'
        ? FadeIn.duration(500)
        : currentSlide?.transition === 'slide'
          ? SlideInRight.duration(400)
          : currentSlide?.transition === 'zoom'
            ? ZoomIn.duration(500)
            : FadeIn.duration(300);

    const exiting =
      currentSlide?.transition === 'fade'
        ? FadeOut.duration(400)
        : currentSlide?.transition === 'slide'
          ? SlideOutLeft.duration(350)
          : FadeOut.duration(250);

    return (
      <Animated.View
        key={transitionKey}
        entering={entering}
        exiting={exiting}
        style={styles.slideContainer}
      >
        <Image
          source={{ uri: currentPhoto.uri }}
          style={[styles.photo, { width: screenWidth, height: screenHeight }]}
          resizeMode="cover"
        />
        {currentSlide?.caption ? (
          <View style={[styles.captionWrap, { bottom: insets.bottom + 100 }]}>
            <Text style={styles.captionText}>{currentSlide.caption}</Text>
          </View>
        ) : null}
      </Animated.View>
    );
  };

  if (!story || slides.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>
          故事为空
        </Text>
        <Pressable onPress={navigation.goBack} style={styles.closeBtn}>
          <Text style={{ color: '#fff', fontSize: 16 }}>✕</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleTap}>
        {renderSlide()}
      </Pressable>

      <View style={[styles.header, { top: insets.top + 8 }]}>
        <Pressable onPress={navigation.goBack} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {story.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {story.subtitle}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.progressContainer, { top: insets.top + 4 }]}>
        {slides.map((_, idx) => (
          <View key={idx} style={styles.progressTrack}>
            {idx < currentIndex ? (
              <View style={[styles.progressFill, { width: '100%' }]} />
            ) : idx === currentIndex ? (
              <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
            ) : null}
          </View>
        ))}
      </View>

      <View style={[styles.controls, { bottom: insets.bottom + 16 }]}>
        <Pressable onPress={goPrev} style={styles.controlBtn}>
          <Text style={styles.controlIcon}>⏮</Text>
        </Pressable>
        <Pressable onPress={() => setIsPlaying(!isPlaying)} style={styles.controlBtn}>
          <Text style={styles.controlIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
        </Pressable>
        <Pressable onPress={goNext} style={styles.controlBtn}>
          <Text style={styles.controlIcon}>⏭</Text>
        </Pressable>
      </View>

      <View style={[styles.slideIndicator, { bottom: insets.bottom + 56 }]}>
        <Text style={styles.slideIndicatorText}>
          {currentIndex + 1} / {slides.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slideContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {},
  captionWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 12,
  },
  captionText: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
  },
  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#fff',
    fontSize: 16,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: '#ffffffcc',
    fontSize: 13,
    marginTop: 2,
  },
  progressContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 3,
    zIndex: 10,
  },
  progressTrack: {
    flex: 1,
    height: PROGRESS_BAR_HEIGHT,
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    zIndex: 10,
  },
  controlBtn: {
    padding: 8,
  },
  controlIcon: {
    fontSize: 28,
    color: '#fff',
  },
  slideIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  slideIndicatorText: {
    color: '#ffffffaa',
    fontSize: 13,
  },
});
