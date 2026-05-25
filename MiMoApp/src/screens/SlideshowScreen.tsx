import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePhotoStore } from '../store';
import type { Photo } from '../types';

// ============================================================
// SlideshowScreen — Ken Burns 效果全屏幻灯片
// 后期增强：音乐、过渡动画、自定义间隔
// ============================================================

import type { RootStackScreenProps } from '../navigation/types';

export function SlideshowScreen({ route, navigation }: RootStackScreenProps<'Slideshow'>) {
  const { photoIds } = route.params;
  const initialIndex = 0;
  const intervalMs = 4000;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const photos = usePhotoStore((s) => s.photos);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;

  const photoList = photoIds
    .map((id) => photos.find((p) => p.id === id))
    .filter(Boolean) as Photo[];

  const currentPhoto = photoList[currentIndex];

  // Ken Burns 效果：缓慢缩放+平移
  useEffect(() => {
    if (!isPlaying) return;
    // 重置动画
    scaleAnim.setValue(1);
    translateAnim.setValue(0);

    // 开始 Ken Burns
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.15,
        duration: intervalMs * 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 20,
        duration: intervalMs * 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex, isPlaying]);

  // 自动切换
  useEffect(() => {
    if (!isPlaying || photoList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photoList.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, photoList.length, intervalMs]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photoList.length);
  }, [photoList.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photoList.length) % photoList.length);
  }, [photoList.length]);

  if (!currentPhoto) {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>没有照片</Text>
        <Pressable onPress={navigation.goBack} style={styles.closeBtn}>
          <Text style={{ color: '#fff', fontSize: 16 }}>关闭</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      {/* 关闭按钮 */}
      <Pressable
        style={[styles.closeBtn, { top: insets.top + 12 }]}
        onPress={navigation.goBack}
      >
        <Text style={{ color: '#fff', fontSize: 16 }}>✕</Text>
      </Pressable>

      {/* Ken Burns 动画图片 */}
      <Animated.View
        style={[
          styles.imageWrap,
          {
            transform: [
              { scale: scaleAnim },
              { translateX: translateAnim },
            ],
          },
        ]}
      >
        <Image
          source={{ uri: currentPhoto.uri }}
          style={[styles.image, { width: screenWidth, height: screenHeight * 0.75 }]}
          resizeMode="cover"
        />
      </Animated.View>

      {/* 照片信息 */}
      <View style={[styles.infoBar, { bottom: insets.bottom + 80 }]}>
        <Text style={styles.infoDate}>{currentPhoto.dateTaken}</Text>
        {currentPhoto.locationName && (
          <Text style={styles.infoLocation}>📍 {currentPhoto.locationName}</Text>
        )}
        {currentPhoto.aiTags && (
          <Text style={styles.infoTags}>
            {currentPhoto.aiTags.slice(0, 3).join(' · ')}
          </Text>
        )}
      </View>

      {/* 控制栏 */}
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

      {/* 进度指示器 */}
      <View style={[styles.progress, { bottom: insets.bottom + 56 }]}>
        {photoList.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              {
                backgroundColor: idx === currentIndex ? '#fff' : '#ffffff66',
                width: idx === currentIndex ? 24 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {},
  infoBar: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  infoDate: { color: '#fff', fontSize: 16, fontWeight: '700' },
  infoLocation: { color: '#fff', fontSize: 14, marginTop: 2, opacity: 0.9 },
  infoTags: { color: '#fff', fontSize: 12, marginTop: 4, opacity: 0.7 },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  controlBtn: { padding: 8 },
  controlIcon: { fontSize: 28, color: '#fff' },
  progress: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dot: { height: 4, borderRadius: 2 },
});
