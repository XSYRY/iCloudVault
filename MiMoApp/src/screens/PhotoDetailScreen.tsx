import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  useWindowDimensions,
  Image,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { usePhotoStore, useUiStore } from '../store';
import { LineIcon } from '../components/shared/LineIcon';
import type { RootStackScreenProps } from '../navigation/types';
import type { Photo } from '../types';

const FLIP_DURATION = 500;
const PAPER_COLOR = '#FFFEF9';
const INK_COLOR = '#3C3226';
const ACCENT_COLOR = '#8B7355';
const TAPE_COLOR = 'rgba(220,200,160,0.55)';

function formatDisplayDate(dateTaken: string, timeTaken: string): string {
  const d = new Date(dateTaken);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}年${month}月${day}日 ${timeTaken.slice(0, 5)}`;
}

export function PhotoDetailScreen({ route, navigation }: RootStackScreenProps<'PhotoDetail'>) {
  const { photoId, photoIds } = route.params ?? {};
  const safePhotoIds = photoIds ?? [photoId ?? ''];
  const safePhotoId = photoId ?? safePhotoIds[0] ?? '';
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const updatePhoto = usePhotoStore((s) => s.updatePhoto);
  const showToast = useUiStore((s) => s.showToast);
  const photos = usePhotoStore((s) => s.photos);

  const [isUiVisible, setIsUiVisible] = useState(true);
  const initialIndex = Math.max(safePhotoIds.indexOf(safePhotoId), 0);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  const flipY = useSharedValue(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [memoText, setMemoText] = useState('');

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

  const uiOpacity = useSharedValue(1);

  const toggleUi = useCallback(() => {
    if (isFlipped) return;
    setIsUiVisible((v) => !v);
  }, [isFlipped]);

  const handleFlip = useCallback(() => {
    if (isFlipped) {
      if (currentPhoto) {
        updatePhoto(currentPhoto.id, { memo: memoText });
        if (memoText.trim()) {
          showToast('便签已保存', 'success');
        }
      }
      flipY.value = withTiming(0, { duration: FLIP_DURATION, easing: Easing.inOut(Easing.ease) });
      setIsFlipped(false);
      setIsUiVisible(true);
    } else {
      if (currentPhoto) {
        setMemoText(currentPhoto.memo ?? '');
      }
      flipY.value = withTiming(180, { duration: FLIP_DURATION, easing: Easing.inOut(Easing.ease) });
      setIsFlipped(true);
      setIsUiVisible(false);
    }
  }, [isFlipped, currentPhoto, memoText, flipY, updatePhoto, showToast]);

  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateY: `${flipY.value}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateY: `${flipY.value + 180}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

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

  const cardWidth = screenWidth - 48;
  const cardHeight = screenHeight * 0.65;

  return (
    <View style={s.root}>
      <FlatList
        ref={flatListRef}
        data={photoList}
        renderItem={({ item }) => (
          <PhotoCard
            item={item}
            width={screenWidth}
            height={screenHeight}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            onSingleTap={toggleUi}
            frontAnimatedStyle={frontAnimatedStyle}
            backAnimatedStyle={backAnimatedStyle}
            isFlipped={isFlipped}
            memoText={memoText}
            onMemoChange={setMemoText}
            onFlip={handleFlip}
          />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={StyleSheet.absoluteFillObject}
        scrollEnabled={!isFlipped}
      />

      {!isFlipped && (
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
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
          <Pressable onPress={handleFlip} hitSlop={12} style={s.flipTopBtn}>
            <LineIcon name="pencil" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      {!isFlipped && (
        <View style={[s.bottomHint, { bottom: insets.bottom + 24 }]}>
          <Pressable onPress={handleFlip} style={s.flipCornerBtn}>
            <LineIcon name="pencil" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

function PhotoCard({
  item,
  width,
  height,
  cardWidth,
  cardHeight,
  onSingleTap,
  frontAnimatedStyle,
  backAnimatedStyle,
  isFlipped,
  memoText,
  onMemoChange,
  onFlip,
}: {
  item: Photo;
  width: number;
  height: number;
  cardWidth: number;
  cardHeight: number;
  onSingleTap: () => void;
  frontAnimatedStyle: any;
  backAnimatedStyle: any;
  isFlipped: boolean;
  memoText: string;
  onMemoChange: (t: string) => void;
  onFlip: () => void;
}) {
  const [imgUri, setImgUri] = useState(item.uri);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const hasUri = !!(item.uri || item.thumbnailUri);
  const showPlaceholder = !hasUri || failed;

  return (
    <Pressable
      onPress={onSingleTap}
      style={{ width, height, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}
    >
      <View style={s.flipContainer}>
        <Animated.View style={[s.cardBase, frontAnimatedStyle]}>
          {showPlaceholder ? (
            <View style={[s.photoCard, { width: cardWidth, height: cardHeight }, { backgroundColor: item.color || '#1A1A1A', justifyContent: 'center', alignItems: 'center' }]}>
              <LineIcon name="photo" size={48} color="rgba(255,255,255,0.15)" />
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>{item.filename}</Text>
            </View>
          ) : (
            <View style={[s.photoCard, { width: cardWidth, height: cardHeight }]}>
              {loading && (
                <ActivityIndicator size="large" color="rgba(255,255,255,0.6)" style={s.loader} />
              )}
              <Image
                source={{ uri: imgUri, cache: 'force-cache' }}
                style={{ width: cardWidth, height: cardHeight, borderRadius: 4 }}
                resizeMode="contain"
                onLoad={() => setLoading(false)}
                onError={() => {
                  if (imgUri !== item.thumbnailUri && item.thumbnailUri) {
                    setImgUri(item.thumbnailUri);
                  } else {
                    setFailed(true);
                  }
                }}
              />
              <View style={s.tapeTop} />
            </View>
          )}
        </Animated.View>

        <Animated.View style={[s.cardBase, s.backCard, backAnimatedStyle]}>
          <View style={[s.paperCard, { width: cardWidth, height: cardHeight }]}>
            <View style={s.tapeTop} />

            <View style={s.paperHeader}>
              <View style={s.tapeStrip} />
              <Text style={s.paperTitle}>备忘便签</Text>
              <View style={s.tapeStrip} />
            </View>

            <View style={s.dividerWrap}>
              <View style={s.dashedLine} />
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={s.memoInputWrap}
            >
              <TextInput
                style={s.memoInput}
                value={memoText}
                onChangeText={onMemoChange}
                placeholder="在这里写下当时的心情..."
                placeholderTextColor="#C4B99A"
                multiline
                textAlignVertical="top"
                autoFocus={isFlipped}
              />
            </KeyboardAvoidingView>

            <Pressable onPress={onFlip} style={s.saveBtn}>
              <Text style={s.saveBtnText}>保存并翻转</Text>
            </Pressable>

            <View style={s.paperFooter}>
              <Text style={s.footerDate}>
                {item.dateTaken ? new Date(item.dateTaken).toLocaleDateString('zh-CN') : ''}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

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
  flipTopBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  bottomHint: {
    position: 'absolute',
    right: 20,
    zIndex: 20,
  },
  flipCornerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBase: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCard: {
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#111111',
  },
  loader: {
    position: 'absolute',
    zIndex: 2,
  },
  tapeTop: {
    position: 'absolute',
    top: -6,
    left: '25%',
    right: '25%',
    height: 18,
    backgroundColor: TAPE_COLOR,
    borderRadius: 2,
    zIndex: 10,
  },
  backCard: {
    zIndex: -1,
  },
  paperCard: {
    backgroundColor: PAPER_COLOR,
    borderRadius: 4,
    padding: 24,
    paddingTop: 32,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#E8E0D0',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  paperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tapeStrip: {
    width: 40,
    height: 10,
    backgroundColor: TAPE_COLOR,
    borderRadius: 1,
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: INK_COLOR,
    letterSpacing: 2,
  },
  dividerWrap: {
    marginBottom: 16,
  },
  dashedLine: {
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: '#D4C9A8',
  },
  memoInputWrap: {
    flex: 1,
  },
  memoInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: INK_COLOR,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
  saveBtn: {
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 28,
    paddingVertical: 10,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
  },
  paperFooter: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  footerDate: {
    fontSize: 11,
    color: '#B8A88A',
    fontStyle: 'italic',
  },
});
