import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Text, FlatList, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { usePhotoStore, useUiStore, useSettingsStore } from '../store';
import { useMd3Theme } from '../theme';
import { useMemoryPhotos } from '../hooks/useMemoryPhotos';
import type { TabScreenProps } from '../navigation/types';
import type { Photo } from '../types';
import { PhotoGrid } from '../components/photo/PhotoGrid';
import { SearchBar } from '../components/search/SearchBar';
import { SearchSuggestions } from '../components/search/SearchSuggestions';
import { FilterRow } from '../components/filter/FilterRow';
import { FabMenu } from '../components/fab/FabMenu';
import { Toolbar } from '../components/shared/Toolbar';
import { LineIcon } from '../components/shared/LineIcon';
import { hapticMedium, hapticSelection } from '../services/haptics';
import { Toast } from '../components/shared/Toast';
import { MemoryCard } from '../components/shared/MemoryCard';

const AiOverlay = React.lazy(() => import('../components/overlays/AiOverlay').then(m => ({ default: m.AiOverlay })));
const DedupOverlay = React.lazy(() => import('../components/overlays/DedupOverlay').then(m => ({ default: m.DedupOverlay })));
const StatsModal = React.lazy(() => import('../components/overlays/StatsModal').then(m => ({ default: m.StatsModal })));
const SettingsModal = React.lazy(() => import('../components/overlays/SettingsModal').then(m => ({ default: m.SettingsModal })));
const BatchEditModal = React.lazy(() => import('../components/overlays/BatchEditModal').then(m => ({ default: m.BatchEditModal })));
const AlbumChipMenu = React.lazy(() => import('../components/albums/AlbumChipMenu').then(m => ({ default: m.AlbumChipMenu })));

export function GridScreen({ navigation }: TabScreenProps<'PhotosTab'>) {
  const theme = useMd3Theme();
  const photos = usePhotoStore((s) => s.photos);
  const filter = usePhotoStore((s) => s.filter);
  const sortMode = usePhotoStore((s) => s.sortMode);
  const setFilter = usePhotoStore((s) => s.setFilter);
  const selectionMode = usePhotoStore((s) => s.selectionMode);
  const enterSelection = usePhotoStore((s) => s.enterSelection);
  const exitSelection = usePhotoStore((s) => s.exitSelection);
  const selectedIds = usePhotoStore((s) => s.selectedIds);
  const toggleSelection = usePhotoStore((s) => s.toggleSelection);
  const isSearchActive = useUiStore((s) => s.isSearchActive);
  const setSearchActive = useUiStore((s) => s.setSearchActive);
  const setStatsVisible = useUiStore((s) => s.setStatsModalVisible);
  const setSettingsVisible = useUiStore((s) => s.setSettingsModalVisible);
  const memories = useMemoryPhotos();

  const selBarY = useSharedValue(80);
  const selBarOpacity = useSharedValue(0);

  useEffect(() => {
    if (selectionMode && selectedIds.size > 0) {
      selBarY.value = withTiming(0, { duration: 280 });
      selBarOpacity.value = withTiming(1, { duration: 250 });
    } else {
      selBarY.value = withTiming(80, { duration: 200 });
      selBarOpacity.value = withTiming(0, { duration: 180 });
    }
  }, [selectionMode, selectedIds.size]);

  const selBarAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: selBarY.value }],
    opacity: selBarOpacity.value,
  }));

  const filteredPhotos = useMemo(() => {
    let result = photos.filter((p) => !p.isDeleted);
    if (filter.category) result = result.filter((p) => p.aiCategory === filter.category);
    if (filter.isFavorite) result = result.filter((p) => p.isFavorite);
    if (filter.location) result = result.filter((p) => p.locationName?.includes(filter.location!));
    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.filename.toLowerCase().includes(q) ||
          (p.aiTags && p.aiTags.some((t) => t.toLowerCase().includes(q))) ||
          p.locationName?.toLowerCase().includes(q) ||
          p.dateTaken.includes(q),
      );
    }
    result.sort((a, b) => {
      switch (sortMode) {
        case 'date-asc': return a.createdAt - b.createdAt;
        case 'name': return a.filename.localeCompare(b.filename);
        case 'size': return a.sizeBytes - b.sizeBytes;
        case 'date-desc':
        default: return b.createdAt - a.createdAt;
      }
    });
    return result;
  }, [photos, filter, sortMode]);

  const handlePhotoPress = useCallback(
    (photoId: string) => {
      if (selectionMode) {
        toggleSelection(photoId);
        return;
      }
      const ids = filteredPhotos.map((p) => p.id);
      navigation.navigate('Lightbox', { photoId, photoIds: ids });
    },
    [filteredPhotos, navigation, selectionMode, toggleSelection],
  );

  const handlePhotoLongPress = useCallback(
    (photoId: string) => {
      hapticMedium();
      if (!selectionMode) {
        enterSelection();
        toggleSelection(photoId);
      }
    },
    [selectionMode, enterSelection, toggleSelection],
  );

  const [albumMenuVisible, setAlbumMenuVisible] = useState(false);
  const [batchEditVisible, setBatchEditVisible] = useState(false);

  const handleSearchSelect = useCallback(
    (query: string) => {
      setFilter({ searchQuery: query });
      setSearchActive(false);
    },
    [setFilter, setSearchActive],
  );

  const handleSearchSubmit = useCallback(
    (query: string) => {
      setSearchActive(false);
      navigation.navigate('SearchResults', { query });
    },
    [navigation, setSearchActive],
  );

  const handleSelectionAction = useCallback(
    (action: 'collage' | 'compare' | 'slideshow' | 'album' | 'batchEdit') => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;
      switch (action) {
        case 'collage':
          navigation.navigate('Collage', { photoIds: ids.slice(0, 9) });
          break;
        case 'compare':
          navigation.navigate('Compare', { photoId: ids[0], photoIds: ids });
          break;
        case 'slideshow':
          navigation.navigate('Slideshow', { photoIds: ids });
          break;
        case 'album':
          setAlbumMenuVisible(true);
          return;
        case 'batchEdit':
          setBatchEditVisible(true);
          return;
      }
      hapticSelection();
      exitSelection();
    },
    [selectedIds, navigation, exitSelection],
  );

  const hasActiveFilter =
    filter.category !== null ||
    filter.isFavorite !== null ||
    filter.searchQuery !== '';

  const ListHeader = useMemo(() => {
    const components: React.ReactElement[] = [];
    if (hasActiveFilter && filteredPhotos.length === 0) {
      components.push(
        <View key="no-results" style={[styles.noResults, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View style={[styles.emptyIllust, { backgroundColor: theme.colors.surface }]}>
            <LineIcon name="search" size={48} color={theme.colors.scrim} />
          </View>
          <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>没有找到匹配的照片</Text>
          <Text style={[styles.emptySub, { color: theme.colors.onSurfaceVariant }]}>尝试调整筛选条件或搜索关键词</Text>
        </View>,
      );
    }
    if (!hasActiveFilter && memories.length > 0 && filteredPhotos.length > 0) {
      const mem = memories[0];
      const memPhoto = mem.photos[0];
      components.push(
        <MemoryCard
          key={`mem-${mem.type}-${mem.dateLabel}`}
          memory={mem}
          photoUri={memPhoto?.thumbnailUri}
          color={memPhoto?.color}
          onPress={(photoId) => {
            const ids = mem.photos.map((p) => p.id);
            navigation.navigate('Lightbox', { photoId, photoIds: ids });
          }}
        />,
      );
    }
    return components.length > 0 ? <View style={{ marginBottom: 8 }}>{components}</View> : null;
  }, [hasActiveFilter, filteredPhotos.length, memories, photos, theme, navigation, filteredPhotos]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Toolbar
        title={selectionMode ? `${selectedIds.size} 已选` : 'Momento'}
        subtitle={!selectionMode && hasActiveFilter ? `${filteredPhotos.length} 张` : undefined}
        actions={
          !selectionMode ? (
            <View style={styles.headerActions}>
              <Pressable style={[styles.headerBtn, { backgroundColor: theme.colors.surfaceVariant }]} onPress={() => setStatsVisible(true)}>
                <LineIcon name="bar-chart" size={22} color={theme.colors.onSurfaceVariant} />
              </Pressable>
              <Pressable style={[styles.headerBtn, { backgroundColor: theme.colors.surfaceVariant }]} onPress={() => setSettingsVisible(true)}>
                <LineIcon name="settings" size={22} color={theme.colors.onSurfaceVariant} />
              </Pressable>
            </View>
          ) : (
            <Pressable style={[styles.cancelBtn, { backgroundColor: theme.colors.surfaceVariant }]} onPress={() => { hapticSelection(); exitSelection(); }}>
              <Text style={{ color: theme.colors.primary, fontSize: 15, fontWeight: '500' }}>取消</Text>
            </Pressable>
          )
        }
      />

      {isSearchActive ? (
        <View style={{ flex: 1 }}>
          <SearchBar
            isActive={true}
            onFocus={() => {}}
            onSubmit={handleSearchSubmit}
            onClose={() => {
              setSearchActive(false);
              setFilter({ searchQuery: '' });
            }}
          />
          <SearchSuggestions onSelect={handleSearchSelect} />
        </View>
      ) : (
        <>
          <View style={styles.searchFilterSection}>
            <SearchBar
              isActive={false}
              onFocus={() => setSearchActive(true)}
              onSubmit={handleSearchSubmit}
              onClose={() => setSearchActive(false)}
            />
            <FilterRow />
          </View>
          <PhotoGrid
            photos={filteredPhotos}
            onPhotoPress={handlePhotoPress}
            onPhotoLongPress={handlePhotoLongPress}
            selectedIds={selectionMode ? selectedIds : undefined}
            selectMode={selectionMode}
            style={styles.photoGrid}
          />
        </>
      )}

      {selectionMode && selectedIds.size > 0 && (
        <Animated.View pointerEvents="box-none" style={[styles.selectionBar, { backgroundColor: theme.colors.surfaceContainer, borderTopColor: theme.colors.outlineVariant }, selBarAnim]}>
          <View style={[styles.selectionInfo, { backgroundColor: theme.colors.surfaceContainerHighest }]}>
            <Text style={[styles.selectionCount, { color: theme.colors.onSurface }]}>{selectedIds.size}</Text>
            <Text style={[styles.selectionLabel, { color: theme.colors.onSurfaceVariant }]}>已选</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectionActions}>
            <Pressable
              style={[styles.selectionBtn, { backgroundColor: theme.colors.background }]}
              onPress={() => handleSelectionAction('collage')}
            >
              <LineIcon name="image" size={16} color={theme.colors.onSurface} />
              <Text style={[styles.selectionBtnLabel, { color: theme.colors.onSurface }]}>拼图</Text>
            </Pressable>
            <Pressable
              style={[styles.selectionBtn, { backgroundColor: theme.colors.background }]}
              onPress={() => handleSelectionAction('compare')}
            >
              <LineIcon name="compare" size={16} color={theme.colors.onSurface} />
              <Text style={[styles.selectionBtnLabel, { color: theme.colors.onSurface }]}>对比</Text>
            </Pressable>
            <Pressable
              style={[styles.selectionBtn, { backgroundColor: theme.colors.background }]}
              onPress={() => handleSelectionAction('slideshow')}
            >
              <LineIcon name="play" size={16} color={theme.colors.onSurface} />
              <Text style={[styles.selectionBtnLabel, { color: theme.colors.onSurface }]}>幻灯片</Text>
            </Pressable>
            <Pressable
              style={[styles.selectionBtn, { backgroundColor: theme.colors.background }]}
              onPress={() => handleSelectionAction('album')}
            >
              <LineIcon name="folder" size={16} color={theme.colors.onSurface} />
              <Text style={[styles.selectionBtnLabel, { color: theme.colors.onSurface }]}>添加到相册</Text>
            </Pressable>
            <Pressable
              style={[styles.selectionBtn, { backgroundColor: theme.colors.errorContainer }]}
              onPress={() => handleSelectionAction('batchEdit')}
            >
              <LineIcon name="trash" size={16} color={theme.colors.error} />
              <Text style={[styles.selectionBtnLabel, { color: theme.colors.error }]}>删除</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      )}

      <FabMenu navigation={navigation} />
      <Toast />
      <React.Suspense fallback={null}><AiOverlay /></React.Suspense>
      <React.Suspense fallback={null}><DedupOverlay /></React.Suspense>
      <React.Suspense fallback={null}><StatsModal /></React.Suspense>
      <React.Suspense fallback={null}><SettingsModal /></React.Suspense>
      <React.Suspense fallback={null}><AlbumChipMenu
        visible={albumMenuVisible}
        photoIds={Array.from(selectedIds)}
        onClose={() => setAlbumMenuVisible(false)}
        onDone={() => {
          setAlbumMenuVisible(false);
          hapticSelection();
          exitSelection();
        }}
      /></React.Suspense>
      <React.Suspense fallback={null}><BatchEditModal
        visible={batchEditVisible}
        photoIds={Array.from(selectedIds)}
        onClose={() => {
          setBatchEditVisible(false);
          hapticSelection();
          exitSelection();
        }}
      /></React.Suspense>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchFilterSection: { overflow: 'hidden', paddingHorizontal: 20, gap: 0 },
  photoGrid: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerBtn: {
    padding: 8,
    borderRadius: 999,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  selectionBar: {
    position: 'absolute',
    bottom: 96,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 0,
  },
  selectionInfo: {
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 56,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectionCount: {
    fontSize: 24,
    fontWeight: '700',
  },
  selectionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectionActions: {
    flex: 1,
    gap: 8,
  },
  selectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 0,
    gap: 8,
    flexShrink: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0,
  },
  selectionBtnLabel: { fontSize: 14, fontWeight: '600' },
  noResults: {
    margin: 20,
    padding: 28,
    paddingTop: 40,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  emptyIllust: {
    width: 140,
    height: 140,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  emptySub: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 1.5,
    maxWidth: 260,
    textAlign: 'center',
  },
});
