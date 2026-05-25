import React, { useCallback, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMd3Theme } from '../theme';
import { usePhotoStore } from '../store';
import { PhotoCard } from '../components/photo/PhotoCard';
import { EmptyState } from '../components/shared/EmptyState';
import { LineIcon } from '../components/shared/LineIcon';
import { hapticMedium } from '../services/haptics';
import { Toolbar } from '../components/shared/Toolbar';
import { useThumbnailPrefetch } from '../utils/thumbnailCache';
import type { RootStackScreenProps } from '../navigation/types';

export function LivePhotoScreen({ navigation }: RootStackScreenProps<'LivePhoto'>) {
  const theme = useMd3Theme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const photos = usePhotoStore((s) => s.photos);
  const gridColumns = usePhotoStore((s) => s.filter) as any;
  const selectionMode = usePhotoStore((s) => s.selectionMode);
  const selectedIds = usePhotoStore((s) => s.selectedIds);
  const toggleSelection = usePhotoStore((s) => s.toggleSelection);
  const enterSelection = usePhotoStore((s) => s.enterSelection);

  // 状态追踪当前可视区域的开始和结束索引
  const [visibleRange, setVisibleRange] = useState<{ start: number; end: number } | undefined>(undefined);

  const livePhotos = useMemo(
    () => photos.filter((p) => p.mediaType === 'live' && !p.isDeleted && !p.isHidden),
    [photos],
  );

  const cardSize = useMemo(() => {
    const cols = 3;
    const gap = 3;
    return (width - gap * (cols + 1)) / cols;
  }, [width]);

  const handlePress = useCallback(
    (photoId: string) => {
      if (selectionMode) {
        toggleSelection(photoId);
      } else {
        navigation.navigate('Lightbox', {
          photoId,
          photoIds: livePhotos.map((p) => p.id),
        });
      }
    },
    [selectionMode, toggleSelection, navigation, livePhotos],
  );

  const handleLongPress = useCallback(
    (photoId: string) => {
      hapticMedium();
      if (!selectionMode) enterSelection();
      toggleSelection(photoId);
    },
    [selectionMode, enterSelection, toggleSelection],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: typeof livePhotos[0]; index: number }) => (
      <PhotoCard
        photo={item}
        size={cardSize}
        index={index}
        selected={selectedIds.has(item.id)}
        selectMode={selectionMode}
        onPress={handlePress}
        onLongPress={handleLongPress}
      />
    ),
    [cardSize, selectedIds, selectionMode, handlePress, handleLongPress],
  );

  // 检测可视区域元素变化，用于缩略图预加载
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    if (viewableItems.length > 0) {
      let start = Infinity;
      let end = -Infinity;
      for (const item of viewableItems) {
        if (item.index !== null) {
          if (item.index < start) start = item.index;
          if (item.index > end) end = item.index;
        }
      }
      if (start !== Infinity && end !== -Infinity) {
        setVisibleRange({ start, end });
      }
    }
  }, []);

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 10, // 只要露出 10% 即判定可见，有助于尽早预加载
  }).current;

  // 使用高性能缩略图预加载 Hook
  useThumbnailPrefetch(livePhotos, visibleRange);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Toolbar
        title={`实况照片 (${livePhotos.length})`}
        onBack={() => navigation.goBack()}
        actions={
          <Pressable
            onPress={() => navigation.navigate('Lightbox', {
              photoId: livePhotos[0]?.id ?? '',
              photoIds: livePhotos.map((p) => p.id),
            })}
            disabled={livePhotos.length === 0}
            style={styles.playAllBtn}
          >
            <LineIcon name="play" size={18} color={theme.colors.primary} />
            <Text style={[styles.playAllText, { color: theme.colors.primary }]}>播放全部</Text>
          </Pressable>
        }
      />

      {livePhotos.length === 0 ? (
        <EmptyState
          icon="live-photo"
          title="暂无实况照片"
          subtitle="实况照片会在导入时自动识别"
        />
      ) : (
        <FlashList
          data={livePhotos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={3}
          estimatedItemSize={cardSize}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  listContent: {
    paddingTop: 3,
    paddingHorizontal: 3,
    paddingBottom: 20,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  playAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
