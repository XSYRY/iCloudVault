import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInLeft, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { LineIcon } from '../components/shared/LineIcon';
import type { TabScreenProps } from '../navigation/types';
import { hapticMedium } from '../services/haptics';
import { useAlbumStore } from '../store/albumStore';
import { usePhotoStore } from '../store/photoStore';
import { useUiStore } from '../store/uiStore';
import { useMd3Theme } from '../theme';
import type { Album, Category, Photo } from '../types';

const CATEGORIES: { icon: string; label: string; category: Category }[] = [
  { icon: 'heart', label: '人物', category: 'person' },
  { icon: 'map-pin', label: '地点', category: 'landscape' },
  { icon: 'camera', label: '物件', category: 'object' },
  { icon: 'sparkle', label: '回忆', category: 'other' },
  { icon: 'folder', label: '文档', category: 'document' },
];

type AlbumMoment = Album & {
  coverColor: string;
  coverUri?: string;
  intro: string | null;
  previewUris: string[];
  dateLabel: string;
  locationHint: string | null;
  lastCapturedAt: number;
  toneLabel: string;
};

function formatMomentDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (date.getFullYear() !== now.getFullYear()) {
    return `${date.getFullYear()}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
  }

  return `${month}月${day}日`;
}

function pickLocationHint(photos: Photo[]): string | null {
  const counter = new Map<string, number>();

  for (const photo of photos) {
    if (!photo.locationName) continue;
    counter.set(photo.locationName, (counter.get(photo.locationName) ?? 0) + 1);
  }

  let winner: string | null = null;
  let maxCount = 0;
  for (const [name, count] of counter.entries()) {
    if (count > maxCount) {
      winner = name;
      maxCount = count;
    }
  }

  return winner;
}

function getToneLabel(album: Album, photoCount: number): string {
  if (album.isSmart) return '自动线索';
  if (photoCount >= 24) return '长镜头';
  if (photoCount >= 10) return '章节';
  return '片段';
}

function getAlbumCopy(item: AlbumMoment): string {
  if (item.intro) return item.intro;
  if (item.locationHint) return `围绕 ${item.locationHint} 收拢的一页片段`;
  if (item.photoCount > 0) return '把零散瞬间排成一条更好读的记忆线';
  return '这里还等着你放进第一张照片';
}

function getAlbumMeta(item: AlbumMoment): string {
  if (item.locationHint) return `${item.photoCount}张  ${item.locationHint}`;
  return `${item.photoCount}张  ${item.dateLabel}`;
}

function renderPreviewImage(uri: string | undefined, style: object) {
  if (!uri) {
    return <View style={style} />;
  }

  return <Image source={{ uri }} style={style} resizeMode="cover" />;
}

export function AlbumsScreen({ navigation }: TabScreenProps<'AlbumsTab'>) {
  const theme = useMd3Theme();
  const insets = useSafeAreaInsets();
  const albums = useAlbumStore((s) => s.albums);
  const createAlbum = useAlbumStore((s) => s.createAlbum);
  const deleteAlbum = useAlbumStore((s) => s.deleteAlbum);
  const updateAlbum = useAlbumStore((s) => s.updateAlbum);
  const photos = usePhotoStore((s) => s.photos);
  const setFilter = usePhotoStore((s) => s.setFilter);
  const showToast = useUiStore((s) => s.showToast);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');

  const activePhotos = useMemo(() => photos.filter((photo) => !photo.isDeleted), [photos]);

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<Category, number>> = {};
    for (const photo of activePhotos) {
      if (photo.aiCategory) {
        counts[photo.aiCategory] = (counts[photo.aiCategory] ?? 0) + 1;
      }
    }
    return counts;
  }, [activePhotos]);

  const photoLookup = useMemo(() => {
    const lookup = new Map<string, Photo>();
    for (const photo of activePhotos) {
      lookup.set(photo.id, photo);
    }
    return lookup;
  }, [activePhotos]);

  const albumMoments = useMemo<AlbumMoment[]>(() => {
    return albums.map((album) => {
      const albumPhotos = album.photoIds
        .map((photoId) => photoLookup.get(photoId))
        .filter(Boolean) as Photo[];
      const coverPhoto = albumPhotos[0];
      const previewUris = albumPhotos
        .slice(0, 4)
        .map((photo) => photo.thumbnailUri || photo.uri)
        .filter(Boolean);
      const lastCapturedAt = albumPhotos.reduce(
        (latest, photo) => Math.max(latest, photo.createdAt),
        album.createdAt,
      );

      return {
        ...album,
        coverUri: album.coverUri || coverPhoto?.thumbnailUri || coverPhoto?.uri,
        coverColor: coverPhoto?.color || '#DDE8E0',
        intro: album.description.trim() || null,
        previewUris,
        dateLabel: formatMomentDate(lastCapturedAt),
        locationHint: pickLocationHint(albumPhotos),
        lastCapturedAt,
        toneLabel: getToneLabel(album, album.photoCount),
      };
    });
  }, [albums, photoLookup]);

  const curatedAlbums = useMemo(() => {
    return [...albumMoments].sort((a, b) => {
      if (b.previewUris.length !== a.previewUris.length) {
        return b.previewUris.length - a.previewUris.length;
      }
      if (b.photoCount !== a.photoCount) {
        return b.photoCount - a.photoCount;
      }
      return b.lastCapturedAt - a.lastCapturedAt;
    });
  }, [albumMoments]);

  const featuredAlbum = curatedAlbums[0] ?? null;
  const secondaryAlbums = curatedAlbums.slice(1, 3);

  const remainingAlbums = useMemo(() => {
    const spotlightIds = new Set([featuredAlbum?.id, ...secondaryAlbums.map((item) => item.id)].filter(Boolean));

    return albumMoments
      .filter((item) => !spotlightIds.has(item.id))
      .sort((a, b) => b.lastCapturedAt - a.lastCapturedAt);
  }, [albumMoments, featuredAlbum, secondaryAlbums]);

  const albumStats = useMemo(() => {
    const collectedIds = new Set<string>();
    for (const album of albums) {
      for (const photoId of album.photoIds) collectedIds.add(photoId);
    }

    return [
      { icon: 'folder', label: '相册', value: String(albums.length) },
      { icon: 'image', label: '已归档', value: String(collectedIds.size) },
      { icon: 'sparkle', label: '智能集', value: String(albums.filter((album) => album.isSmart).length) },
    ];
  }, [albums]);

  const handleCategoryPress = useCallback(
    (category: Category, label: string) => {
      setFilter({ category, searchQuery: '' });
      navigation.navigate('SearchResults', { query: label });
    },
    [navigation, setFilter],
  );

  const handleAlbumPress = useCallback(
    (albumId: string) => {
      navigation.navigate('AlbumDetail', { albumId });
    },
    [navigation],
  );

  const handleAlbumLongPress = useCallback(
    (albumId: string, albumName: string) => {
      hapticMedium();
      Alert.alert(albumName, '选择操作', [
        { text: '取消', style: 'cancel' },
        {
          text: '删除相册',
          style: 'destructive',
          onPress: () => {
            deleteAlbum(albumId);
            showToast('已删除相册', 'success');
          },
        },
        {
          text: '重命名',
          onPress: () => {
            updateAlbum(albumId, { name: `${albumName} 01` });
            showToast('已重新命名', 'success');
          },
        },
      ]);
    },
    [deleteAlbum, showToast, updateAlbum],
  );

  const handleCreateAlbum = useCallback(() => {
    setShowCreateModal(true);
    setNewAlbumName('');
  }, []);

  const confirmCreateAlbum = useCallback(() => {
    const name = newAlbumName.trim() || '新建相册';
    const album = createAlbum(name);
    setShowCreateModal(false);
    setNewAlbumName('');
    showToast('已创建相册', 'success');
    navigation.navigate('AlbumDetail', { albumId: album.id });
  }, [createAlbum, navigation, newAlbumName, showToast]);

  const renderFeaturedAlbum = useCallback(
    (item: AlbumMoment) => (
      <Animated.View entering={FadeInUp.springify()} style={styles.featuredWrap}>
        <Pressable
          onPress={() => handleAlbumPress(item.id)}
          onLongPress={() => handleAlbumLongPress(item.id, item.name)}
          style={[styles.featuredCard, { backgroundColor: item.coverColor }]}
        >
          {item.coverUri ? (
            <Image source={{ uri: item.coverUri }} style={styles.featuredImage} resizeMode="cover" />
          ) : (
            <View style={styles.featuredFallback}>
              <LineIcon name="image" size={34} color={theme.colors.onSurface} />
            </View>
          )}
          <LinearGradient
            colors={['rgba(19, 28, 23, 0.10)', 'rgba(19, 28, 23, 0.72)']}
            style={styles.featuredGradient}
          />
          <View style={styles.featuredFloatingStack}>
            {item.previewUris.slice(1, 3).map((uri, index) => (
              <View
                key={`${item.id}-${uri}-${index}`}
                style={[
                  styles.featuredFloatingCard,
                  {
                    transform: [{ rotate: index === 0 ? '-6deg' : '6deg' }],
                    backgroundColor: theme.colors.surfaceContainerLowest,
                  },
                ]}
              >
                {renderPreviewImage(uri, styles.featuredFloatingImage)}
              </View>
            ))}
          </View>
          <View style={styles.featuredContent}>
            <Text style={[styles.featuredEyebrow, { color: '#F4F6F3' }]}>{item.toneLabel}</Text>
            <Text style={[styles.featuredTitle, { color: '#FFFFFF' }]} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={[styles.featuredIntro, { color: 'rgba(255,255,255,0.82)' }]} numberOfLines={2}>
              {getAlbumCopy(item)}
            </Text>
            <View style={styles.featuredMetaRow}>
              <View style={[styles.metaPill, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
                <Text style={[styles.metaPillText, { color: '#FFFFFF' }]}>{`${item.photoCount}张`}</Text>
              </View>
              <View style={[styles.metaPill, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
                <Text style={[styles.metaPillText, { color: '#FFFFFF' }]}>
                  {item.locationHint || item.dateLabel}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    ),
    [handleAlbumLongPress, handleAlbumPress, theme.colors.onSurface, theme.colors.surfaceContainerLowest],
  );

  const renderStoryboardAlbum = useCallback(
    (item: AlbumMoment, index: number) => (
      <Animated.View
        key={item.id}
        entering={FadeInUp.delay(index * 90).springify()}
        style={styles.storyboardCell}
      >
        <Pressable
          onPress={() => handleAlbumPress(item.id)}
          onLongPress={() => handleAlbumLongPress(item.id, item.name)}
          style={[styles.storyboardCard, { backgroundColor: theme.colors.surfaceContainerLowest }]}
        >
          <View style={styles.storyboardGrid}>
            <View style={[styles.storyboardPrimary, { backgroundColor: item.coverColor }]}>
              {item.coverUri ? (
                <Image source={{ uri: item.coverUri }} style={styles.storyboardPrimaryImage} resizeMode="cover" />
              ) : (
                <LineIcon name="image" size={24} color={theme.colors.onSurface} />
              )}
            </View>
            <View style={styles.storyboardSecondaryColumn}>
              {[item.previewUris[1], item.previewUris[2]].map((uri, slotIndex) => (
                <View
                  key={`${item.id}-slot-${slotIndex}`}
                  style={[
                    styles.storyboardSecondaryCard,
                    {
                      backgroundColor:
                        slotIndex === 0 ? theme.colors.surfaceContainerHigh : theme.colors.surfaceContainer,
                    },
                  ]}
                >
                  {uri ? (
                    <Image source={{ uri }} style={styles.storyboardSecondaryImage} resizeMode="cover" />
                  ) : (
                    <LineIcon name="image" size={18} color={theme.colors.outline} />
                  )}
                </View>
              ))}
            </View>
          </View>
          <View style={styles.storyboardBody}>
            <Text style={[styles.storyboardTone, { color: theme.colors.outline }]}>{item.toneLabel}</Text>
            <Text style={[styles.storyboardTitle, { color: theme.colors.onSurface }]} numberOfLines={2}>
              {item.name}
            </Text>
            <Text
              style={[styles.storyboardDescription, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={2}
            >
              {getAlbumCopy(item)}
            </Text>
            <Text style={[styles.storyboardMeta, { color: theme.colors.outline }]} numberOfLines={1}>
              {getAlbumMeta(item)}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    ),
    [
      handleAlbumLongPress,
      handleAlbumPress,
      theme.colors.onSurface,
      theme.colors.onSurfaceVariant,
      theme.colors.outline,
      theme.colors.surfaceContainer,
      theme.colors.surfaceContainerHigh,
      theme.colors.surfaceContainerLowest,
    ],
  );

  const renderQuietAlbum = useCallback(
    ({ item, index }: { item: AlbumMoment; index: number }) => {
      const reverse = index % 2 === 1;

      return (
        <Animated.View entering={FadeInUp.delay(index * 40).springify()} style={styles.quietWrap}>
          <Pressable
            onPress={() => handleAlbumPress(item.id)}
            onLongPress={() => handleAlbumLongPress(item.id, item.name)}
            style={[
              styles.quietCard,
              { backgroundColor: theme.colors.surfaceContainerLowest },
              reverse && styles.quietCardReverse,
            ]}
          >
            <View style={[styles.quietVisual, { backgroundColor: item.coverColor }]}>
              {item.coverUri ? (
                <Image source={{ uri: item.coverUri }} style={styles.quietVisualImage} resizeMode="cover" />
              ) : (
                <LineIcon name="image" size={28} color={theme.colors.onSurface} />
              )}
              <View style={styles.quietThumbStrip}>
                {item.previewUris.slice(1, 3).map((uri, thumbIndex) => (
                  <View
                    key={`${item.id}-thumb-${thumbIndex}`}
                    style={[styles.quietThumb, { backgroundColor: theme.colors.surfaceContainerLow }]}
                  >
                    {renderPreviewImage(uri, styles.quietThumbImage)}
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.quietBody}>
              <Text style={[styles.quietTone, { color: theme.colors.outline }]}>{item.toneLabel}</Text>
              <Text style={[styles.quietTitle, { color: theme.colors.onSurface }]} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={[styles.quietDescription, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
                {getAlbumCopy(item)}
              </Text>
              <View style={styles.quietFooter}>
                <Text style={[styles.quietMeta, { color: theme.colors.outline }]} numberOfLines={1}>
                  {`${item.photoCount}张`}
                </Text>
                <Text style={[styles.quietMeta, { color: theme.colors.outline }]} numberOfLines={1}>
                  {item.locationHint || item.dateLabel}
                </Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      );
    },
    [
      handleAlbumLongPress,
      handleAlbumPress,
      theme.colors.onSurface,
      theme.colors.onSurfaceVariant,
      theme.colors.outline,
      theme.colors.surfaceContainerLow,
      theme.colors.surfaceContainerLowest,
    ],
  );

  const listHeader = (
    <View>
      <Animated.View entering={FadeInUp.springify()} style={styles.albumConsole}>
        {albumStats.map((item) => (
          <View
            key={item.label}
            style={[
              styles.albumStatCard,
              {
                backgroundColor: theme.colors.surfaceContainerLowest,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={[styles.albumStatIcon, { backgroundColor: theme.colors.surfaceContainer }]}>
              <LineIcon name={item.icon} size={16} color={theme.colors.onSurface} />
            </View>
            <Text style={[styles.albumStatValue, { color: theme.colors.onSurface }]}>{item.value}</Text>
            <Text style={[styles.albumStatLabel, { color: theme.colors.outline }]}>{item.label}</Text>
          </View>
        ))}
      </Animated.View>
      <Animated.View entering={FadeInUp.springify()} style={styles.editorialIntro}>
        <Text style={[styles.editorialKicker, { color: theme.colors.outline }]}>
          私人放映厅
        </Text>
        <Text style={[styles.editorialSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          零散的瞬间被收进不同章节，像一本只给自己翻的分镜本。
        </Text>
      </Animated.View>

      {featuredAlbum ? renderFeaturedAlbum(featuredAlbum) : null}

      {secondaryAlbums.length > 0 ? (
        <View style={styles.storyboardRow}>
          {secondaryAlbums.map((item, index) => renderStoryboardAlbum(item, index))}
        </View>
      ) : null}

      <View style={styles.categorySection}>
        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            按线索翻
          </Text>
          <Text style={[styles.sectionCaption, { color: theme.colors.outline }]}>
            快速切到人、地点和物件
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRail}
        >
          {CATEGORIES.map((item, index) => (
            <Animated.View key={item.category} entering={FadeInLeft.delay(index * 55).springify()}>
              <Pressable
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: theme.colors.surfaceContainerLowest,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
                onPress={() => handleCategoryPress(item.category, item.label)}
              >
                <View style={[styles.categoryPillIcon, { backgroundColor: theme.colors.surfaceContainer }]}>
                  <LineIcon name={item.icon} size={16} color={theme.colors.onSurface} />
                </View>
                <Text style={[styles.categoryPillText, { color: theme.colors.onSurface }]}>
                  {item.label}
                </Text>
                <Text style={[styles.categoryPillCount, { color: theme.colors.outline }]}>
                  {categoryCounts[item.category] ?? 0}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            全部相册
          </Text>
          <Text style={[styles.sectionCaption, { color: theme.colors.outline }]}>
            按最近的记忆线慢慢往下翻
          </Text>
        </View>
        <Pressable
          style={[styles.createPill, { backgroundColor: theme.colors.onSurface }]}
          onPress={handleCreateAlbum}
        >
          <LineIcon name="plus" size={16} color={theme.colors.surface} />
          <Text style={[styles.createPillText, { color: theme.colors.surface }]}>
            新建
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.surface }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>相册</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerBtn} onPress={() => navigation.navigate('Search')}>
            <LineIcon name="search" size={20} color={theme.colors.onSurface} />
          </Pressable>
          <Pressable style={styles.headerBtn} onPress={() => navigation.navigate('Settings')}>
            <LineIcon name="more" size={20} color={theme.colors.onSurface} />
          </Pressable>
        </View>
      </View>

      <FlashList
        data={remainingAlbums}
        keyExtractor={(item) => item.id}
        renderItem={renderQuietAlbum}
        estimatedItemSize={184}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          albumMoments.length === 0 ? (
            <View style={styles.emptyWrap}>
              <LineIcon name="folder" size={40} color={theme.colors.outlineVariant} />
              <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                还没有相册
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.outline }]}>
                先收起一个小主题，以后这里会长成你的私人片场
              </Text>
              <Pressable
                style={[styles.emptyCreateBtn, { backgroundColor: theme.colors.surfaceContainerHighest }]}
                onPress={handleCreateAlbum}
              >
                <Text style={[styles.emptyCreateText, { color: theme.colors.onSurface }]}>
                  创建第一个相册
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                今天的片场就到这里
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.outline }]}>
                新的主题会继续接在后面
              </Text>
            </View>
          )
        }
      />

      {showCreateModal ? (
        <Pressable style={styles.modalOverlay} onPress={() => setShowCreateModal(false)}>
          <Animated.View
            entering={ZoomIn.springify()}
            style={[styles.modalCard, { backgroundColor: theme.colors.surfaceContainerLowest }]}
          >
            <Pressable onPress={(event) => event.stopPropagation()}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                新建相册
              </Text>
              <Text
                style={[styles.modalHint, { color: theme.colors.outline }]}
              >
                可以先取个主题感强一点的名字
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    borderColor: theme.colors.outlineVariant,
                    color: theme.colors.onSurface,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                placeholder="比如：雨夜走路 / 江边两天"
                placeholderTextColor={theme.colors.outline}
                value={newAlbumName}
                onChangeText={setNewAlbumName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={confirmCreateAlbum}
              />
              <View style={styles.modalActions}>
                <Pressable style={styles.modalCancel} onPress={() => setShowCreateModal(false)}>
                  <Text style={[styles.modalCancelText, { color: theme.colors.outline }]}>
                    取消
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.modalConfirm, { backgroundColor: theme.colors.onSurface }]}
                  onPress={confirmCreateAlbum}
                >
                  <Text style={[styles.modalConfirmText, { color: theme.colors.surface }]}>
                    创建
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 128,
  },
  editorialIntro: {
    display: 'none',
    paddingTop: 20,
    paddingBottom: 22,
    gap: 6,
  },
  albumConsole: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 16,
    paddingBottom: 18,
  },
  albumStatCard: {
    flex: 1,
    minHeight: 92,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    justifyContent: 'space-between',
  },
  albumStatIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumStatValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
  },
  albumStatLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  editorialKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  editorialSubtitle: {
    fontSize: 19,
    lineHeight: 28,
    fontWeight: '700',
    maxWidth: '90%',
  },
  featuredWrap: {
    marginBottom: 16,
  },
  featuredCard: {
    height: 304,
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredFallback: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredContent: {
    paddingHorizontal: 22,
    paddingBottom: 22,
    gap: 7,
  },
  featuredEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  featuredTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    maxWidth: '82%',
  },
  featuredIntro: {
    fontSize: 14,
    lineHeight: 21,
    maxWidth: '76%',
  },
  featuredMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  metaPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuredFloatingStack: {
    position: 'absolute',
    right: 18,
    top: 24,
    gap: 10,
  },
  featuredFloatingCard: {
    width: 74,
    height: 92,
    borderRadius: 18,
    padding: 5,
  },
  featuredFloatingImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  storyboardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  storyboardCell: {
    flex: 1,
  },
  storyboardCard: {
    borderRadius: 24,
    padding: 12,
    gap: 12,
  },
  storyboardGrid: {
    flexDirection: 'row',
    height: 148,
    gap: 8,
  },
  storyboardPrimary: {
    flex: 1.15,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyboardPrimaryImage: {
    ...StyleSheet.absoluteFillObject,
  },
  storyboardSecondaryColumn: {
    flex: 0.85,
    gap: 8,
  },
  storyboardSecondaryCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyboardSecondaryImage: {
    ...StyleSheet.absoluteFillObject,
  },
  storyboardBody: {
    gap: 5,
  },
  storyboardTone: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  storyboardTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  storyboardDescription: {
    fontSize: 13,
    lineHeight: 19,
    minHeight: 38,
  },
  storyboardMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  categorySection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 14,
  },
  sectionHeading: {
    gap: 3,
    flexShrink: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionCaption: {
    fontSize: 12,
    lineHeight: 18,
  },
  categoryRail: {
    paddingTop: 12,
    gap: 10,
    paddingRight: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  categoryPillIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryPillCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  createPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  createPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  quietWrap: {
    marginBottom: 14,
  },
  quietCard: {
    borderRadius: 26,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 164,
  },
  quietCardReverse: {
    flexDirection: 'row-reverse',
  },
  quietVisual: {
    width: 138,
    minHeight: 164,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  quietVisualImage: {
    ...StyleSheet.absoluteFillObject,
  },
  quietThumbStrip: {
    width: '100%',
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 6,
  },
  quietThumb: {
    height: 36,
    borderRadius: 10,
    overflow: 'hidden',
  },
  quietThumbImage: {
    width: '100%',
    height: '100%',
  },
  quietBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'space-between',
    gap: 6,
  },
  quietTone: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  quietTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  quietDescription: {
    fontSize: 13,
    lineHeight: 19,
    flexShrink: 1,
  },
  quietFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
  },
  quietMeta: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyCreateBtn: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  emptyCreateText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalCard: {
    width: '84%',
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalHint: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalCancel: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalConfirm: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
