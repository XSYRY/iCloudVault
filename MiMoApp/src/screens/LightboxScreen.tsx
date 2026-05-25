import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withTiming,
  interpolate,
  Extrapolate,
  type SharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { usePhotoStore, useUiStore } from '../store';
import { useShare } from '../hooks/useShare';
import type { RootStackScreenProps } from '../navigation/types';
import { PhotoActionSheet } from '../components/overlays/PhotoActionSheet';
import { ExifEditor } from '../components/lightbox/ExifEditor';
import { LightboxImage } from '../components/lightbox/LightboxImage';
import { LineIcon } from '../components/shared/LineIcon';
import { LivePhotoPlayer } from '../components/photo/LivePhotoPlayer';
import { hapticSuccess, hapticWarning } from '../services/haptics';
import type { Photo } from '../types';

const THUMB_SLOT = 58;
const SCRUBBER_HORIZONTAL_PAD = 16;

let VideoComponent: React.ComponentType<any> | null = null;
try {
  const mod = require('react-native-video');
  VideoComponent = mod.default || mod;
} catch {
  VideoComponent = null;
}

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDisplayDate(dateTaken: string, timeTaken: string): string {
  const d = new Date(dateTaken);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}年${month}月${day}日 ${timeTaken.slice(0, 5)}`;
}

function FilmstripThumb({
  photo,
  index,
  scrollX,
  onPress,
}: {
  photo: Photo;
  index: number;
  scrollX: SharedValue<number>;
  onPress: () => void;
}) {
  const thumbAnim = useAnimatedStyle(() => {
    const centerIndex = scrollX.value / THUMB_SLOT;
    const distance = Math.abs(index - centerIndex);
    const width = interpolate(distance, [0, 0.85, 1.8], [66, 46, 38], Extrapolate.CLAMP);
    const height = interpolate(distance, [0, 0.85, 1.8], [50, 42, 36], Extrapolate.CLAMP);
    const opacity = interpolate(distance, [0, 1, 2.2], [1, 0.82, 0.5], Extrapolate.CLAMP);
    const translateY = interpolate(distance, [0, 1.2], [-4, 4], Extrapolate.CLAMP);

    return {
      width,
      height,
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <Pressable onPress={onPress} style={s.thumbSlot} hitSlop={8}>
      <Animated.View style={[s.thumb, thumbAnim]}>
        <Image
          source={{ uri: photo.thumbnailUri || photo.uri, cache: 'force-cache' }}
          style={s.thumbImg}
          resizeMode="cover"
        />
        {photo.mediaType === 'video' ? (
          <View style={s.videoBadge}>
            <LineIcon name="play" size={9} color="#FFFFFF" />
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

export function LightboxScreen({ route, navigation }: RootStackScreenProps<'Lightbox'>) {
  const { photoId, photoIds } = route.params ?? {};
  const safePhotoIds = photoIds ?? [photoId ?? ''];
  const safePhotoId = photoId ?? safePhotoIds[0] ?? '';
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const updatePhoto = usePhotoStore((s) => s.updatePhoto);
  const showToast = useUiStore((s) => s.showToast);
  const photos = usePhotoStore((s) => s.photos);
  const { share: doShare } = useShare();

  const [isUiVisible, setIsUiVisible] = useState(true);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showExifEditor, setShowExifEditor] = useState(false);
  const initialIndex = Math.max(safePhotoIds.indexOf(safePhotoId), 0);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrubberRef = useRef<any>(null);
  const isScrubbingSv = useSharedValue(false);
  const lastCenteredIndexRef = useRef(initialIndex);

  const uiOpacity = useSharedValue(1);
  const scrubberX = useSharedValue(initialIndex * THUMB_SLOT);

  const videoRef = useRef<any>(null);
  const videoSeekBarWidthRef = useRef(screenWidth - 32);
  const [videoPaused, setVideoPaused] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoSeekRatio = useSharedValue(0);
  const isSeekDragging = useSharedValue(false);

  useEffect(() => {
    uiOpacity.value = withTiming(isUiVisible ? 1 : 0, { duration: 250 });
  }, [isUiVisible]);

  const topAnim = useAnimatedStyle(() => ({
    opacity: uiOpacity.value,
  }));

  const bottomAnim = useAnimatedStyle(() => ({
    opacity: uiOpacity.value,
  }));

  const photoMap = useMemo(() => {
    const m = new Map<string, Photo>();
    for (const p of photos) m.set(p.id, p);
    return m;
  }, [photos]);

  const currentPhotoId = safePhotoIds[currentIndex];
  const currentPhoto = photoMap.get(currentPhotoId);
  const photoList = useMemo(
    () => safePhotoIds.map((id) => photoMap.get(id)).filter(Boolean) as Photo[],
    [safePhotoIds, photoMap],
  );
  const scrubberSidePadding = Math.max(
    SCRUBBER_HORIZONTAL_PAD,
    screenWidth / 2 - THUMB_SLOT / 2,
  );
  const toggleUi = useCallback(() => {
    setIsUiVisible((v) => !v);
  }, []);

  const handleThumbPress = useCallback((index: number) => {
    isScrubbingSv.value = false;
    lastCenteredIndexRef.current = index;
    setCurrentIndex(index);
  }, [isScrubbingSv]);

  const commitCurrentFromScrubber = useCallback((index?: number) => {
    const idx = index ?? Math.round(scrubberX.value / THUMB_SLOT);
    const nextIndex = Math.min(Math.max(idx, 0), Math.max(photoList.length - 1, 0));
    if (lastCenteredIndexRef.current === nextIndex) return;
    lastCenteredIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);
  }, [scrubberX, photoList.length]);

  const syncIndexFromScrubber = useCallback((offsetX: number) => {
    const idx = Math.round(offsetX / THUMB_SLOT);
    const nextIndex = Math.min(Math.max(idx, 0), Math.max(photoList.length - 1, 0));
    if (lastCenteredIndexRef.current !== nextIndex) {
      lastCenteredIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
    }
  }, [photoList.length]);

  const scrubberScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrubberX.value = event.contentOffset.x;
      if (isScrubbingSv.value) {
        runOnJS(syncIndexFromScrubber)(event.contentOffset.x);
      }
    },
  });

  const handleFavorite = useCallback(() => {
    if (!currentPhoto) return;
    updatePhoto(currentPhoto.id, { isFavorite: !currentPhoto.isFavorite });
    showToast(currentPhoto.isFavorite ? '已取消收藏' : '已收藏', 'success');
    hapticSuccess();
  }, [currentPhoto, updatePhoto, showToast]);

  const handleDelete = useCallback(() => {
    if (!currentPhoto) return;
    updatePhoto(currentPhoto.id, { isDeleted: true, deletedAt: Date.now() });
    showToast('已移至回收站', 'info');
    hapticWarning();
    if (safePhotoIds.length <= 1) {
      navigation.goBack();
    }
  }, [currentPhoto, updatePhoto, showToast, safePhotoIds, navigation]);

  const handleShare = useCallback(() => {
    if (!currentPhoto) return;
    doShare(currentPhoto);
  }, [currentPhoto, doShare]);

  const handleEdit = useCallback(() => {
    if (!currentPhoto) return;
    navigation.navigate('EditPanel', { photoId: currentPhoto.id });
  }, [currentPhoto, navigation]);

  const handleComment = useCallback(() => {
    if (!currentPhoto) return;
    navigation.navigate('PhotoDetail', {
      photoId: currentPhoto.id,
      photoIds: safePhotoIds,
    });
  }, [currentPhoto, navigation, safePhotoIds]);

  const handleCompare = useCallback(() => {
    navigation.navigate('Compare', { photoId: currentPhotoId, photoIds: safePhotoIds });
  }, [currentPhotoId, safePhotoIds, navigation]);

  const handleVideoProgress = useCallback((data: { currentTime: number }) => {
    setVideoCurrentTime(data.currentTime * 1000);
  }, []);

  const handleVideoLoad = useCallback((data: { duration: number }) => {
    setVideoDuration(data.duration * 1000);
  }, []);

  const handleVideoEnd = useCallback(() => {
    setVideoPaused(true);
    setVideoCurrentTime(0);
    videoRef.current?.seek(0);
  }, []);

  const toggleVideoPause = useCallback(() => {
    setVideoPaused((p) => !p);
  }, []);

  const commitVideoSeek = useCallback((ratio: number) => {
    const ms = ratio * videoDuration;
    videoRef.current?.seek(ms / 1000);
    setVideoCurrentTime(ms);
  }, [videoDuration]);

  const videoSeekGesture = useMemo(() =>
    Gesture.Pan()
      .onStart((event) => {
        isSeekDragging.value = true;
        const x = event.x;
        const w = videoSeekBarWidthRef.current;
        const ratio = Math.min(1, Math.max(0, x / w));
        videoSeekRatio.value = ratio;
      })
      .onUpdate((event) => {
        const x = event.x;
        const w = videoSeekBarWidthRef.current;
        const ratio = Math.min(1, Math.max(0, x / w));
        videoSeekRatio.value = ratio;
      })
      .onEnd((event) => {
        isSeekDragging.value = false;
        const x = event.x;
        const w = videoSeekBarWidthRef.current;
        const ratio = Math.min(1, Math.max(0, x / w));
        runOnJS(commitVideoSeek)(ratio);
      })
  , [commitVideoSeek, isSeekDragging, videoSeekRatio]);

  const videoSeekProgressStyle = useAnimatedStyle(() => ({
    width: `${videoSeekRatio.value * 100}%`,
  }));

  const videoSeekThumbStyle = useAnimatedStyle(() => ({
    left: `${videoSeekRatio.value * 100}%`,
  }));

  const goToPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(photoList.length - 1, i + 1));
  }, [photoList.length]);

  const handleDismiss = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    if (scrubberRef.current && photoList.length > 0 && !isScrubbingSv.value) {
      const offset = currentIndex * THUMB_SLOT;
      lastCenteredIndexRef.current = currentIndex;
      scrubberRef.current.scrollTo({ x: Math.max(0, offset), animated: true });
    }
    setVideoPaused(false);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    videoSeekRatio.value = 0;
  }, [currentIndex, photoList.length, isScrubbingSv, videoSeekRatio]);

  useEffect(() => {
    if (!isSeekDragging.value && videoDuration > 0) {
      videoSeekRatio.value = videoCurrentTime / videoDuration;
    }
  }, [videoCurrentTime, videoDuration, isSeekDragging, videoSeekRatio]);

  if (photoList.length === 0) {
    return (
      <View style={s.root}>
        <Pressable
          style={{ marginTop: insets.top + 12, marginLeft: 16, padding: 12 }}
          onPress={() => navigation.goBack()}
        >
          <LineIcon name="chevron-left" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>照片不存在</Text>
        </View>
      </View>
    );
  }

  const locationText = currentPhoto?.locationName ?? '';
  const dateTimeText = currentPhoto
    ? formatDisplayDate(currentPhoto.dateTaken, currentPhoto.timeTaken)
    : '';

  return (
    <View style={s.root}>
      {/* 主图区域：三路分支 — 照片 / 视频 / 实况 */}
      {currentPhoto && currentPhoto.mediaType === 'live' ? (
        <LivePhotoPlayer
          photo={currentPhoto}
          width={screenWidth}
          height={screenHeight}
        />
      ) : currentPhoto && currentPhoto.mediaType === 'video' && VideoComponent ? (
        <Pressable
          onPress={toggleUi}
          style={{ width: screenWidth, height: screenHeight, backgroundColor: '#000000' }}
        >
          <VideoComponent
            key={currentPhoto.id}
            ref={videoRef}
            source={{ uri: currentPhoto.uri }}
            style={{ width: screenWidth, height: screenHeight }}
            resizeMode="contain"
            paused={videoPaused}
            onProgress={handleVideoProgress}
            onLoad={handleVideoLoad}
            onEnd={handleVideoEnd}
            repeat={false}
          />
          {videoPaused && (
            <View style={videoStyles.playOverlay}>
              <Pressable onPress={toggleVideoPause} style={videoStyles.playCircle}>
                <LineIcon name="play" size={32} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
          {!isUiVisible && !videoPaused && (
            <Pressable style={videoStyles.tapOverlay} onPress={toggleUi} />
          )}
        </Pressable>
      ) : currentPhoto ? (
        <LightboxImage
          key={currentPhoto.id}
          id={currentPhoto.id}
          uri={currentPhoto.uri || currentPhoto.thumbnailUri || ''}
          color={currentPhoto.color || '#000000'}
          onTap={toggleUi}
          onRequestClose={handleDismiss}
          onPrev={currentIndex > 0 ? goToPrev : undefined}
          onNext={currentIndex < photoList.length - 1 ? goToNext : undefined}
        />
      ) : (
        <View style={{ width: screenWidth, height: screenHeight, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
          <ActivityIndicator size="large" color="rgba(255,255,255,0.6)" />
        </View>
      )}

      <Animated.View style={[s.topBar, { paddingTop: insets.top + 8 }, topAnim]}>
        <View style={s.topLeft}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.backArrow}>
            <LineIcon name="chevron-left" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={s.topTextWrap}>
            {locationText ? (
              <Text style={s.locationText} numberOfLines={1}>{locationText}</Text>
            ) : null}
            <Text style={s.dateTimeText} numberOfLines={1}>{dateTimeText}</Text>
          </View>
        </View>
        <Pressable onPress={() => setShowActionSheet(true)} hitSlop={12} style={s.moreBtn}>
          <LineIcon name="settings" size={22} color="#FFFFFF" />
        </Pressable>
      </Animated.View>

      <Animated.View style={[s.bottomWrap, { paddingBottom: insets.bottom + 8 }, bottomAnim]}>
        {currentPhoto?.mediaType === 'video' && (
          <View style={s.videoControlBar}>
            <GestureDetector gesture={videoSeekGesture}>
              <View
                style={s.videoSeekTrack}
                onLayout={(e) => { videoSeekBarWidthRef.current = e.nativeEvent.layout.width; }}
              >
                <Animated.View style={[s.videoSeekProgress, videoSeekProgressStyle]} />
                <Animated.View style={[s.videoSeekThumb, videoSeekThumbStyle]} />
              </View>
            </GestureDetector>
            <View style={s.videoCtrlRow}>
              <Pressable onPress={toggleVideoPause} style={s.videoCtrlBtn}>
                <LineIcon name={videoPaused ? 'play' : 'pause'} size={16} color="#FFFFFF" />
              </Pressable>
              <Text style={s.videoTime}>
                {formatTime(videoCurrentTime)} / {formatTime(videoDuration)}
              </Text>
            </View>
          </View>
        )}

        <View style={s.scrubberShell}>
          <Animated.ScrollView
            ref={scrubberRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.scrubber}
            contentContainerStyle={[
              s.scrubberContent,
              { paddingLeft: scrubberSidePadding, paddingRight: scrubberSidePadding },
            ]}
            onScroll={scrubberScrollHandler}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={THUMB_SLOT}
            snapToAlignment="start"
            disableIntervalMomentum
            onScrollBeginDrag={() => {
              isScrubbingSv.value = true;
            }}
            onMomentumScrollBegin={() => {
              isScrubbingSv.value = true;
            }}
            onMomentumScrollEnd={() => {
              isScrubbingSv.value = false;
              commitCurrentFromScrubber();
            }}
            onScrollEndDrag={() => {
              commitCurrentFromScrubber();
              setTimeout(() => {
                isScrubbingSv.value = false;
              }, 120);
            }}
          >
            {photoList.map((photo, i) => (
              <FilmstripThumb
                key={photo.id}
                photo={photo}
                index={i}
                scrollX={scrubberX}
                onPress={() => handleThumbPress(i)}
              />
            ))}
          </Animated.ScrollView>
          <View pointerEvents="none" style={s.centerTick} />
        </View>

        <View style={s.mediaCountPill} pointerEvents="none">
          <Text style={s.mediaCountText}>
            {currentIndex + 1} / {photoList.length}
          </Text>
        </View>

        <View style={s.actionBar}>
          <Pressable onPress={handleShare} style={s.actionBtn}>
            <LineIcon name="share" size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={handleFavorite} style={s.actionBtn}>
            <LineIcon
              name={currentPhoto?.isFavorite ? 'heart-filled' : 'heart'}
              size={22}
              color={currentPhoto?.isFavorite ? '#FF6B8A' : '#FFFFFF'}
            />
          </Pressable>
          <Pressable onPress={handleComment} style={s.actionBtn}>
            <LineIcon name="message" size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={handleEdit} style={s.actionBtn}>
            <LineIcon name="pencil" size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={handleDelete} style={s.actionBtn}>
            <LineIcon name="trash" size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={() => setShowExifEditor(true)} style={s.actionBtn}>
            <LineIcon name="info" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </Animated.View>

      <PhotoActionSheet
        visible={showActionSheet}
        photo={currentPhoto ?? null}
        onClose={() => setShowActionSheet(false)}
        onEdit={handleEdit}
        onCompare={handleCompare}
        onExifEdit={() => {
          setShowActionSheet(false);
          setShowExifEditor(true);
        }}
      />
      {currentPhoto && (
        <ExifEditor
          visible={showExifEditor}
          photoId={currentPhoto.id}
          exif={currentPhoto.exif}
          onClose={() => setShowExifEditor(false)}
        />
      )}
    </View>
  );
}

const videoStyles = StyleSheet.create({
  tapOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  playOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  playCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
});

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    zIndex: 20,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  backArrow: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTextWrap: {
    justifyContent: 'center',
    paddingTop: 6,
    flexShrink: 1,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  dateTimeText: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '300',
    lineHeight: 16,
  },
  moreBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  scrubberShell: {
    height: 66,
    justifyContent: 'center',
  },
  scrubber: {
    maxHeight: 66,
  },
  scrubberContent: {
    height: 66,
    alignItems: 'center',
  },
  thumbSlot: {
    width: THUMB_SLOT,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumb: {
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 1,
  },
  centerTick: {
    position: 'absolute',
    left: '50%',
    top: 8,
    width: 2,
    height: 50,
    marginLeft: -1,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  videoControlBar: {
    marginHorizontal: 16,
    marginBottom: 6,
  },
  videoSeekTrack: {
    height: 32,
    justifyContent: 'center',
  },
  videoSeekProgress: {
    position: 'absolute',
    height: 3,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  videoSeekThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    marginLeft: -7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  videoCtrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  videoCtrlBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  videoTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  mediaCountPill: {
    alignSelf: 'center',
    marginTop: 7,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.36)',
  },
  mediaCountText: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
