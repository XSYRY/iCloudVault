import React, { useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMd3Theme } from '../theme';
import { usePhotoStore, useAlbumStore, useUiStore } from '../store';
import { generateMemories } from '../services/memories';
import { getStoryGenerator } from '../services/stories';
import type { Story } from '../services/stories';
import { getTagService } from '../services/tags';
import type { TagInfo } from '../services/tags';
import { usePhotosGroupedByLocation } from '../hooks/usePhotos';
import { useLivePhoto } from '../hooks/useLivePhoto';
import { CATEGORY_LABELS, CATEGORY_ICON } from '../utils/constants';
import type { Category, RootStackParamList } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LineIcon } from '../components/shared/LineIcon';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const SCREEN_WIDTH = Dimensions.get('window').width;

export function DiscoveryScreen() {
  const theme = useMd3Theme();
  const navigation = useNavigation<NavProp>();
  const photos = usePhotoStore((s) => s.photos);
  const albums = useAlbumStore((s) => s.albums);
  const cacheStory = useUiStore((s) => s.cacheStory);

  const activePhotos = useMemo(
    () => photos.filter((p) => !p.isDeleted),
    [photos],
  );

  const memories = useMemo(() => generateMemories(activePhotos), [activePhotos]);

  const stories = useMemo(() => {
    const generator = getStoryGenerator();
    const result: Story[] = [];
    if (activePhotos.length > 0) {
      result.push(generator.generateFromPhotos(activePhotos));
    }
    for (const album of albums.slice(0, 3)) {
      const albumPhotos = activePhotos.filter((p) => album.photoIds.includes(p.id));
      if (albumPhotos.length >= 3) {
        result.push(generator.generateFromAlbum(album, albumPhotos));
      }
    }
    return result;
  }, [activePhotos, albums]);

  const tags: TagInfo[] = useMemo(() => getTagService().getAllTags(), []);

  const locationGroups = usePhotosGroupedByLocation();

  const { livePhotos, count: liveCount } = useLivePhoto();

  const categoryGroups = useMemo(() => {
    const map = new Map<Category, typeof activePhotos>();
    for (const p of activePhotos) {
      const cat = p.aiCategory || 'other';
      const arr = map.get(cat) || [];
      arr.push(p);
      map.set(cat, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([category, items]) => ({ category, items }));
  }, [activePhotos]);

  const randomPicks = useMemo(() => {
    const shuffled = [...activePhotos].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  }, [activePhotos]);

  const handleMemoryPress = useCallback(
    (photoId: string, photoIds: string[]) => {
      navigation.navigate('Lightbox', { photoId, photoIds });
    },
    [navigation],
  );

  const handleStoryPress = useCallback(
    (story: Story) => {
      cacheStory(story);
      navigation.navigate('StoryViewer', { storyId: story.id });
    },
    [navigation, cacheStory],
  );

  const handleTagPress = useCallback(
    (tagName: string) => {
      navigation.navigate('SearchResults', { query: tagName });
    },
    [navigation],
  );

  const handleLocationPress = useCallback(() => {
    navigation.navigate('Main');
  }, [navigation]);

  const handleCategoryPress = useCallback(
    (cat: Category) => {
      navigation.navigate('AlbumDetail', { albumId: `cat-${cat}` });
    },
    [navigation],
  );

  const handleRandomPhotoPress = useCallback(
    (photoId: string) => {
      const ids = randomPicks.map((p) => p.id);
      navigation.navigate('Lightbox', { photoId, photoIds: ids });
    },
    [navigation, randomPicks],
  );

  const SectionHeader = ({
    title,
    onSeeAll,
  }: {
    title: string;
    onSeeAll?: () => void;
  }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll}>
          <Text style={[styles.seeAll, { color: theme.colors.primary }]}>
            查看全部
          </Text>
        </Pressable>
      )}
    </View>
  );

  const getPhotoById = (id: string) => photos.find((p) => p.id === id);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.pageTitle, { color: theme.colors.onSurface }]}>
          发现
        </Text>

        {memories.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="回忆" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollContent}
            >
              {memories.map((mem) => {
                const cover = mem.photos[0];
                return (
                  <Pressable
                    key={`mem-${mem.type}-${mem.dateLabel}`}
                    style={[
                      styles.memoryCard,
                      { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                    onPress={() =>
                      handleMemoryPress(
                        cover?.id || '',
                        mem.photos.map((p) => p.id),
                      )
                    }
                  >
                    <View
                      style={[
                        styles.memoryCover,
                        {
                          backgroundColor:
                            cover?.color || theme.colors.primaryContainer,
                        },
                      ]}
                    >
                      {cover?.thumbnailUri && (
                        <Image
                          source={{ uri: cover.thumbnailUri }}
                          style={styles.memoryImage}
                          resizeMode="cover"
                        />
                      )}
                      <View style={styles.memoryOverlay}>
                        <LineIcon
                          name={
                            mem.type === 'on-this-day'
                              ? 'calendar'
                              : mem.type === 'seasonal'
                                ? 'flower-2'
                                : mem.type === 'location'
                                  ? 'map-pin'
                                  : 'user'
                          }
                          size={36}
                          color="#FFFFFF"
                        />
                      </View>
                    </View>
                    <View style={styles.memoryInfo}>
                      <Text
                        style={[
                          styles.memoryTitle,
                          { color: theme.colors.onSurface },
                        ]}
                        numberOfLines={1}
                      >
                        {mem.title}
                      </Text>
                      <Text
                        style={[
                          styles.memorySub,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                        numberOfLines={1}
                      >
                        {mem.subtitle}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {stories.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="故事推荐" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollContent}
            >
              {stories.map((story) => {
                const coverPhoto = getPhotoById(story.coverPhotoId);
                return (
                  <Pressable
                    key={story.id}
                    style={[
                      styles.storyCard,
                      { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                    onPress={() => handleStoryPress(story)}
                  >
                    <View
                      style={[
                        styles.storyCover,
                        {
                          backgroundColor:
                            coverPhoto?.color || theme.colors.secondaryContainer,
                        },
                      ]}
                    >
                      {coverPhoto?.thumbnailUri && (
                        <Image
                          source={{ uri: coverPhoto.thumbnailUri }}
                          style={styles.storyImage}
                          resizeMode="cover"
                        />
                      )}
                      <View style={styles.storyOverlay}>
                        <LineIcon name="play" size={32} color="#FFFFFF" fill="#FFFFFF" />
                      </View>
                    </View>
                    <View style={styles.storyInfo}>
                      <Text
                        style={[
                          styles.storyTitle,
                          { color: theme.colors.onSurface },
                        ]}
                        numberOfLines={1}
                      >
                        {story.title}
                      </Text>
                      <Text
                        style={[
                          styles.storySub,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                        numberOfLines={1}
                      >
                        {story.subtitle}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {tags.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="热门标签" />
            <View style={styles.tagCloud}>
              {tags.slice(0, 20).map((tag) => (
                <Pressable
                  key={tag.name}
                  style={[
                    styles.tagChip,
                    { backgroundColor: theme.colors.secondaryContainer },
                  ]}
                  onPress={() => handleTagPress(tag.name)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: theme.colors.onSecondaryContainer },
                    ]}
                  >
                    {tag.name} ({tag.count})
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {liveCount > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="实况照片"
              onSeeAll={() => navigation.navigate('LivePhoto', {
                photoId: livePhotos[0]?.id ?? '',
                photoIds: livePhotos.map((p) => p.id),
              })}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollContent}
            >
              {livePhotos.slice(0, 10).map((photo) => (
                <Pressable
                  key={photo.id}
                  style={styles.liveCard}
                  onPress={() => navigation.navigate('Lightbox', {
                    photoId: photo.id,
                    photoIds: livePhotos.map((p) => p.id),
                  })}
                >
                  <View style={[styles.liveThumb, { backgroundColor: photo.color || theme.colors.surfaceVariant }]}>
                    {photo.thumbnailUri && (
                      <Image source={{ uri: photo.thumbnailUri }} style={styles.liveImage} resizeMode="cover" />
                    )}
                    <View style={styles.liveBadge}>
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {locationGroups.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="地点探索" onSeeAll={handleLocationPress} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollContent}
            >
              {locationGroups.slice(0, 10).map((loc) => {
                const cover = loc.items[0];
                return (
                  <Pressable
                    key={loc.location}
                    style={[
                      styles.locationCard,
                      { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                    onPress={handleLocationPress}
                  >
                    <View
                      style={[
                        styles.locationThumb,
                        {
                          backgroundColor:
                            cover?.color || theme.colors.tertiaryContainer,
                        },
                      ]}
                    >
                      {cover?.thumbnailUri && (
                        <Image
                          source={{ uri: cover.thumbnailUri }}
                          style={styles.locationImage}
                          resizeMode="cover"
                        />
                      )}
                    </View>
                    <View style={styles.locationInfo}>
                      <Text
                        style={[
                          styles.locationName,
                          { color: theme.colors.onSurface },
                        ]}
                        numberOfLines={1}
                      >
                        {loc.location}
                      </Text>
                      <Text
                        style={[
                          styles.locationCount,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {loc.items.length} 张
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {categoryGroups.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="分类概览" />
            <View style={styles.categoryGrid}>
              {categoryGroups.map((group) => {
                const cover = group.items[0];
                const iconName = CATEGORY_ICON[group.category] || 'camera';
                const label =
                  CATEGORY_LABELS[group.category] || group.category;
                return (
                  <Pressable
                    key={group.category}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                    onPress={() => handleCategoryPress(group.category)}
                  >
                    <View
                      style={[
                        styles.categoryCover,
                        {
                          backgroundColor:
                            cover?.color || theme.colors.primaryContainer,
                        },
                      ]}
                    >
                      {cover?.thumbnailUri && (
                        <Image
                          source={{ uri: cover.thumbnailUri }}
                          style={styles.categoryImage}
                          resizeMode="cover"
                        />
                      )}
                      <View style={styles.categoryEmojiOverlay}>
                        <LineIcon name={iconName} size={32} color="#FFFFFF" />
                      </View>
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text
                        style={[
                          styles.categoryName,
                          { color: theme.colors.onSurface },
                        ]}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                      <Text
                        style={[
                          styles.categoryCount,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {group.items.length} 张
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {randomPicks.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="随机精选" />
            <View style={styles.randomGrid}>
              {randomPicks.map((photo) => (
                <Pressable
                  key={photo.id}
                  style={styles.randomItem}
                  onPress={() => handleRandomPhotoPress(photo.id)}
                >
                  <View
                    style={[
                      styles.randomThumb,
                      {
                        backgroundColor:
                          photo.color || theme.colors.surfaceVariant,
                      },
                    ]}
                  >
                    {photo.thumbnailUri && (
                      <Image
                        source={{ uri: photo.thumbnailUri }}
                        style={styles.randomImage}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const STORY_CARD_WIDTH = SCREEN_WIDTH * 0.55;
const LOCATION_CARD_WIDTH = SCREEN_WIDTH * 0.4;
const CATEGORY_CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const RANDOM_ITEM_SIZE = (SCREEN_WIDTH - 48) / 3;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingBottom: 16 },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    paddingHorizontal: 20,
    marginBottom: 24,
    color: '#2C3E35',
  },
  section: { marginBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2C3E35' },
  seeAll: { fontSize: 14, fontWeight: '600', color: '#5A7A6A' },
  hScrollContent: { paddingHorizontal: 16, gap: 14 },

  memoryCard: {
    width: CARD_WIDTH,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
  },
  memoryCover: { height: 160, width: '100%' },
  memoryImage: { width: '100%', height: '100%' },
  memoryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00000033',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memoryInfo: { padding: 18 },
  memoryTitle: { fontSize: 15, fontWeight: '700', color: '#2C3E35' },
  memorySub: { fontSize: 12, marginTop: 2, color: '#5A7A6A' },

  storyCard: {
    width: STORY_CARD_WIDTH,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  storyCover: { height: 140, width: '100%' },
  storyImage: { width: '100%', height: '100%' },
  storyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00000044',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyInfo: { padding: 14 },
  storyTitle: { fontSize: 14, fontWeight: '700', color: '#2C3E35' },
  storySub: { fontSize: 11, marginTop: 2, color: '#5A7A6A' },

  tagCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  tagChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  tagText: { fontSize: 13, fontWeight: '600' },

  locationCard: {
    width: LOCATION_CARD_WIDTH,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  locationThumb: { height: 100, width: '100%' },
  locationImage: { width: '100%', height: '100%' },
  locationInfo: { padding: 12 },
  locationName: { fontSize: 13, fontWeight: '700', color: '#2C3E35' },
  locationCount: { fontSize: 11, marginTop: 2, color: '#5A7A6A' },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    width: CATEGORY_CARD_WIDTH,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  categoryCover: { height: 120, width: '100%' },
  categoryImage: { width: '100%', height: '100%' },
  categoryEmojiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00000022',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: { padding: 12 },
  categoryName: { fontSize: 14, fontWeight: '700', color: '#2C3E35' },
  categoryCount: { fontSize: 11, marginTop: 2, color: '#5A7A6A' },

  randomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 8,
  },
  randomItem: {
    width: RANDOM_ITEM_SIZE,
    height: RANDOM_ITEM_SIZE,
  },
  randomThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  randomImage: { width: '100%', height: '100%', borderRadius: 24 },

  liveCard: {
    width: SCREEN_WIDTH * 0.45,
    borderRadius: 24,
    overflow: 'hidden',
  },
  liveThumb: {
    width: '100%',
    height: SCREEN_WIDTH * 0.6,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
