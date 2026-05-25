import React, { memo, useRef, useCallback, useState } from 'react';
import { View, Image, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LivePhotoBadge } from '../photo/LivePhotoBadge';
import type { Photo } from '../../types';

let VideoComponent: React.ComponentType<any> | null = null;
try {
  const mod = require('react-native-video');
  VideoComponent = mod.default || mod;
} catch {
  VideoComponent = null;
}

interface LivePhotoPlayerProps {
  photo: Photo;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
}

export const LivePhotoPlayer = memo(function LivePhotoPlayer({
  photo,
  width,
  height,
  autoPlay = false,
  onPlaybackStart,
  onPlaybackEnd,
}: LivePhotoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const videoRef = useRef<any>(null);
  const borderOpacity = useSharedValue(0);
  const borderScale = useSharedValue(0.95);

  const screenW = width ?? Dimensions.get('window').width;
  const screenH = height ?? Dimensions.get('window').height;

  const handlePressIn = useCallback(() => {
    if (!photo.livePhotoVideoUri || !VideoComponent) return;
    setIsPlaying(true);
    borderOpacity.value = withTiming(1, { duration: 200 });
    borderScale.value = withTiming(1, { duration: 200 });
    onPlaybackStart?.();
  }, [photo.livePhotoVideoUri, onPlaybackStart, borderOpacity, borderScale]);

  const handlePressOut = useCallback(() => {
    setIsPlaying(false);
    borderOpacity.value = withTiming(0, { duration: 300 });
    borderScale.value = withTiming(0.95, { duration: 300 });
    onPlaybackEnd?.();
  }, [onPlaybackEnd, borderOpacity, borderScale]);

  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
    borderOpacity.value = withTiming(0, { duration: 300 });
    borderScale.value = withTiming(0.95, { duration: 300 });
    onPlaybackEnd?.();
  }, [onPlaybackEnd, borderOpacity, borderScale]);

  const borderStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
    transform: [{ scale: borderScale.value }],
  }));

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, { width: screenW, height: screenH }]}
    >
      <Image
        source={{ uri: photo.thumbnailUri || photo.uri, cache: 'force-cache' }}
        style={styles.image}
        resizeMode="cover"
      />

      {isPlaying && photo.livePhotoVideoUri && VideoComponent && (
        <VideoComponent
          ref={videoRef}
          source={{ uri: photo.livePhotoVideoUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          repeat={false}
          paused={false}
          muted={false}
          onEnd={handleVideoEnd}
          ignoreSilentSwitch="ignore"
        />
      )}

      <Animated.View style={[styles.playBorder, borderStyle]} />

      <View style={styles.badgeContainer}>
        <LivePhotoBadge isPlaying={isPlaying} />
      </View>

      {isPlaying && (
        <View style={styles.hintContainer}>
          <Animated.Text style={styles.hintText}>松开停止播放</Animated.Text>
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  playBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 0,
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  hintText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
