import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { LineIcon } from '../components/shared/LineIcon';
import type { RootStackScreenProps } from '../navigation/types';

let VideoComponent: React.ComponentType<any> | null = null;
try {
  const mod = require('react-native-video');
  VideoComponent = mod.default || mod;
} catch {
  VideoComponent = null;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const AUTO_HIDE_MS = 3500;
const SEEK_STEP_S = 10;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function clamp(v: number, lo: number, hi: number) {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
}

export function VideoPlayerScreen({ route, navigation }: RootStackScreenProps<'VideoPlayer'>) {
  const { uri, title } = route.params;
  const insets = useSafeAreaInsets();
  const playerRef = useRef<any>(null);

  const [paused, setPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(2);

  const [showControls, setShowControls] = useState(true);

  const seekProgressSv = useSharedValue(0);
  const bufferProgressSv = useSharedValue(0);
  const isSeekDraggingSv = useSharedValue(false);
  const seekBarWidthRef = useRef(SCREEN_W - 32);

  const gestureTypeSv = useSharedValue<'brightness' | 'volume' | 'seek' | ''>('');
  const gestureValueSv = useSharedValue(0);
  const gestureVisibleSv = useSharedValue(0);

  const controlsOpacitySv = useSharedValue(1);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const brightnessRef = useRef(1);
  const volumeRef = useRef(1);

  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      controlsOpacitySv.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) runOnJS(setShowControls)(false);
      });
    }, AUTO_HIDE_MS);
  }, [controlsOpacitySv]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    controlsOpacitySv.value = 1;
    resetHideTimer();
  }, [controlsOpacitySv, resetHideTimer]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [resetHideTimer]);

  const handleProgress = useCallback((data: { currentTime: number; playableDuration?: number }) => {
    setCurrentTime(data.currentTime * 1000);
    if (data.playableDuration) setBuffered(data.playableDuration * 1000);
  }, []);

  const handleLoad = useCallback((data: { duration: number }) => {
    setDuration(data.duration * 1000);
  }, []);

  const handleEnd = useCallback(() => {
    setPaused(true);
    setCurrentTime(0);
    playerRef.current?.seek(0);
    revealControls();
  }, [revealControls]);

  const togglePause = useCallback(() => {
    setPaused((p) => !p);
    revealControls();
  }, [revealControls]);

  const toggleControls = useCallback(() => {
    if (showControls) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      controlsOpacitySv.value = withTiming(0, { duration: 250 }, (finished) => {
        if (finished) runOnJS(setShowControls)(false);
      });
    } else {
      revealControls();
    }
  }, [showControls, controlsOpacitySv, revealControls]);

  const seekTo = useCallback((ms: number) => {
    const clamped = clamp(ms, 0, duration);
    playerRef.current?.seek(clamped / 1000);
    setCurrentTime(clamped);
  }, [duration]);

  const cycleSpeed = useCallback(() => {
    setSpeedIdx((i) => (i + 1) % SPEEDS.length);
    revealControls();
  }, [revealControls]);

  useEffect(() => {
    if (duration > 0) {
      seekProgressSv.value = currentTime / duration;
    }
  }, [currentTime, duration, seekProgressSv]);

  useEffect(() => {
    if (duration > 0) {
      bufferProgressSv.value = buffered / duration;
    }
  }, [buffered, duration, bufferProgressSv]);

  const commitGestureSeek = useCallback((targetMs: number) => {
    seekTo(targetMs);
  }, [seekTo]);

  const commitGestureEnd = useCallback(() => {
    gestureVisibleSv.value = withTiming(0, { duration: 200 });
  }, [gestureVisibleSv]);

  const showGestureOverlay = useCallback(() => {
    gestureVisibleSv.value = withTiming(1, { duration: 120 });
  }, [gestureVisibleSv]);

  const gestureStartRef = useRef({ x: 0, y: 0, time: 0, side: '' as 'left' | 'right' | '' });
  const gestureAxisRef = useRef<'horizontal' | 'vertical' | null>(null);

  const mainGesture = useMemo(() =>
    Gesture.Pan()
      .onStart((event) => {
        const x = event.x;
        gestureStartRef.current = {
          x,
          y: event.y,
          time: currentTime,
          side: x < SCREEN_W / 2 ? 'left' : 'right',
        };
        gestureAxisRef.current = null;
      })
      .onUpdate((event) => {
        if (!gestureAxisRef.current) {
          if (Math.abs(event.translationX) > 15) gestureAxisRef.current = 'horizontal';
          else if (Math.abs(event.translationY) > 15) gestureAxisRef.current = 'vertical';
          else return;
        }

        if (gestureAxisRef.current === 'horizontal') {
          const seekDelta = (event.translationX / SCREEN_W) * Math.max(duration, 60000);
          const target = clamp(gestureStartRef.current.time + seekDelta, 0, duration);
          const deltaSec = Math.round((target - gestureStartRef.current.time) / 1000);
          gestureTypeSv.value = 'seek';
          gestureValueSv.value = deltaSec;
          gestureVisibleSv.value = 1;
        } else {
          const ratio = clamp(1 - event.translationY / (SCREEN_H * 0.6), 0, 1);
          if (gestureStartRef.current.side === 'left') {
            brightnessRef.current = ratio;
            gestureTypeSv.value = 'brightness';
            gestureValueSv.value = Math.round(ratio * 100);
          } else {
            volumeRef.current = ratio;
            gestureTypeSv.value = 'volume';
            gestureValueSv.value = Math.round(ratio * 100);
          }
          gestureVisibleSv.value = 1;
        }
      })
      .onEnd((event) => {
        if (gestureAxisRef.current === 'horizontal') {
          const seekDelta = (event.translationX / SCREEN_W) * Math.max(duration, 60000);
          const target = clamp(gestureStartRef.current.time + seekDelta, 0, duration);
          runOnJS(commitGestureSeek)(target);
        }
        gestureAxisRef.current = null;
        runOnJS(commitGestureEnd)();
      })
  , [duration, currentTime, gestureTypeSv, gestureValueSv, gestureVisibleSv, commitGestureSeek, commitGestureEnd]);

  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  const handleVideoAreaPress = useCallback(() => {
    const now = Date.now();
    const last = lastTapRef.current;
    if (now - last.time < 300) {
      if (last.x < SCREEN_W / 2) {
        seekTo(currentTime - SEEK_STEP_S * 1000);
        gestureTypeSv.value = 'seek';
        gestureValueSv.value = -SEEK_STEP_S;
        gestureVisibleSv.value = 1;
        setTimeout(() => {
          gestureVisibleSv.value = withTiming(0, { duration: 400 });
        }, 500);
      } else {
        seekTo(currentTime + SEEK_STEP_S * 1000);
        gestureTypeSv.value = 'seek';
        gestureValueSv.value = SEEK_STEP_S;
        gestureVisibleSv.value = 1;
        setTimeout(() => {
          gestureVisibleSv.value = withTiming(0, { duration: 400 });
        }, 500);
      }
      lastTapRef.current = { time: 0, x: 0 };
    } else {
      lastTapRef.current = { time: now, x: last.x };
      setTimeout(() => {
        if (Date.now() - lastTapRef.current.time >= 280) {
          toggleControls();
        }
      }, 310);
    }
  }, [currentTime, seekTo, toggleControls, gestureTypeSv, gestureValueSv, gestureVisibleSv]);

  const commitSeekBarSeek = useCallback((ratio: number) => {
    seekTo(ratio * duration);
    isSeekDraggingSv.value = false;
  }, [duration, seekTo]);

  const seekBarGesture = useMemo(() =>
    Gesture.Pan()
      .onStart((event) => {
        isSeekDraggingSv.value = true;
        const ratio = clamp(event.x / seekBarWidthRef.current, 0, 1);
        seekProgressSv.value = ratio;
      })
      .onUpdate((event) => {
        const ratio = clamp(event.x / seekBarWidthRef.current, 0, 1);
        seekProgressSv.value = ratio;
      })
      .onEnd((event) => {
        const ratio = clamp(event.x / seekBarWidthRef.current, 0, 1);
        runOnJS(commitSeekBarSeek)(ratio);
      })
  , [seekProgressSv, isSeekDraggingSv, commitSeekBarSeek]);

  const controlsOpacityStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacitySv.value,
  }));

  const gestureOverlayStyle = useAnimatedStyle(() => ({
    opacity: gestureVisibleSv.value,
  }));

  const seekProgressStyle = useAnimatedStyle(() => ({
    width: `${seekProgressSv.value * 100}%`,
  }));

  const seekMarkerStyle = useAnimatedStyle(() => ({
    left: `${seekProgressSv.value * 100}%`,
  }));

  const bufferStyle = useAnimatedStyle(() => ({
    width: `${bufferProgressSv.value * 100}%`,
  }));

  const gestureBarFillStyle = useAnimatedStyle(() => ({
    width: `${gestureValueSv.value}%`,
  }));

  const currentSpeed = SPEEDS[speedIdx];

  if (!VideoComponent) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.unavailableText}>视频播放器不可用</Text>
        <Pressable onPress={() => navigation.goBack()} style={[styles.floatBtn, { top: insets.top + 8, left: 16 }]}>
          <LineIcon name="chevron-left" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <GestureDetector gesture={mainGesture}>
        <View style={styles.videoArea}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={(e) => {
              lastTapRef.current = { ...lastTapRef.current, x: e.nativeEvent.locationX };
              handleVideoAreaPress();
            }}
          >
            <VideoComponent
              ref={playerRef}
              source={{ uri }}
              style={styles.video}
              resizeMode="contain"
              paused={paused}
              rate={currentSpeed}
              volume={volumeRef.current}
              onProgress={handleProgress}
              onLoad={handleLoad}
              onEnd={handleEnd}
              repeat={false}
            />
          </Pressable>
        </View>
      </GestureDetector>

      <Animated.View style={[styles.gestureOverlay, gestureOverlayStyle]} pointerEvents="none">
        <View style={styles.gestureCard}>
          <LineIcon
            name={
              gestureTypeSv.value === 'brightness' ? 'sun' :
              gestureTypeSv.value === 'volume' ? (gestureValueSv.value === 0 ? 'volume-x' : 'volume-2') :
              gestureValueSv.value >= 0 ? 'chevron-right' : 'chevron-left'
            }
            size={28}
            color="#FFFFFF"
          />
          <Text style={styles.gestureText}>
            {gestureTypeSv.value === 'seek'
              ? `${gestureValueSv.value >= 0 ? '+' : ''}${gestureValueSv.value}s`
              : `${gestureValueSv.value}%`}
            </Text>
          {gestureTypeSv.value !== 'seek' && (
            <View style={styles.gestureBarBg}>
              <Animated.View style={[styles.gestureBarFill, gestureBarFillStyle]} />
            </View>
          )}
        </View>
      </Animated.View>

      {showControls && (
        <Animated.View style={[StyleSheet.absoluteFill, controlsOpacityStyle]} pointerEvents="box-none">

          <View style={[styles.topGradient, { paddingTop: insets.top + 8 }]}>
            <Pressable onPress={() => navigation.goBack()} style={styles.floatBtn}>
              <LineIcon name="chevron-left" size={20} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title ?? '视频播放'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <Pressable onPress={togglePause} style={styles.centerPlayWrap}>
            <View style={styles.centerPlayBtn}>
              <LineIcon name={paused ? 'play' : 'pause'} size={32} color="#FFFFFF" />
            </View>
          </Pressable>

          <View style={[styles.bottomGradient, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.timelineHeader}>
              <Text style={styles.timelineTime}>{formatTime(currentTime)}</Text>
              <Text style={styles.timelineHint}>
                {isSeekDraggingSv.value ? '松手跳转' : '滑动预览'}
              </Text>
              <Text style={styles.timelineTime}>{formatTime(duration)}</Text>
            </View>
            <GestureDetector gesture={seekBarGesture}>
              <View style={styles.seekBarWrap} onLayout={(e) => { seekBarWidthRef.current = e.nativeEvent.layout.width; }}>
                <View style={styles.seekTrack}>
                  <Animated.View style={[styles.seekBuffer, bufferStyle]} />
                  <Animated.View style={[styles.seekProgress, seekProgressStyle]} />
                </View>
                <Animated.View style={[styles.seekMarker, seekMarkerStyle]}>
                  <View style={styles.seekMarkerLine} />
                  <View style={styles.seekThumb} />
                </Animated.View>
              </View>
            </GestureDetector>

            <View style={styles.controlRow}>
              <Pressable onPress={togglePause} style={styles.ctrlBtn}>
                <LineIcon name={paused ? 'play' : 'pause'} size={18} color="#FFFFFF" />
              </Pressable>

              <Text style={styles.timeText}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>

              <View style={{ flex: 1 }} />

              <Pressable onPress={cycleSpeed} style={styles.speedBadge}>
                <Text style={styles.speedText}>
                  {currentSpeed === 1 ? '倍速' : `${currentSpeed}x`}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  unavailableText: { color: '#fff', fontSize: 16 },

  videoArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  video: { width: '100%', height: '100%' },

  gestureOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gestureCard: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
  },
  gestureText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gestureBarBg: {
    width: 100,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginTop: 4,
    overflow: 'hidden',
  },
  gestureBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },

  topGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 20,
  },
  floatBtn: {
    width: 40, height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 12,
  },

  centerPlayWrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  centerPlayBtn: {
    width: 64, height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,
  },

  bottomGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.46)',
    zIndex: 20,
  },

  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timelineTime: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    minWidth: 46,
  },
  timelineHint: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  seekBarWrap: {
    height: 38,
    justifyContent: 'center',
    marginBottom: 2,
  },
  seekTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  seekBuffer: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderRadius: 999,
  },
  seekProgress: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
  },
  seekMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 28,
    marginLeft: -14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seekMarkerLine: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  seekThumb: {
    width: 18, height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },

  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ctrlBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 90,
  },
  speedBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  speedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
