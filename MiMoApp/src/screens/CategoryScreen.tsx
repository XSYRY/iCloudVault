import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Text, Pressable, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useMd3Theme } from '../theme';
import { usePhotoStore, useUiStore } from '../store';
import { CATEGORY_LABELS, CATEGORY_ICON } from '../utils/constants';
import type { TabScreenProps } from '../navigation/types';
import { Toolbar } from '../components/shared/Toolbar';
import { PhotoCard } from '../components/photo/PhotoCard';
import { EmptyState } from '../components/shared/EmptyState';
import { LineIcon } from '../components/shared/LineIcon';
import type { Category } from '../types';

export function CategoryScreen({ navigation }: TabScreenProps<'PhotosTab'>) {
  const theme = useMd3Theme();
  const photos = usePhotoStore((s) => s.photos);
  const screenWidth = Dimensions.get('window').width;
  const cols = 3;
  const gap = 2;
  const cardSize = Math.floor((screenWidth - gap * 2 - gap * (cols - 1)) / cols);

  // 按分类聚合
  const categoryGroups = useMemo(() => {
    const map = new Map<Category, typeof photos>();
    for (const p of photos) {
      if (p.isDeleted) continue;
      const cat = p.aiCategory || 'other';
      const arr = map.get(cat) || [];
      arr.push(p);
      map.set(cat, arr);
    }
    // 按数量降序
    return Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([cat, items]) => ({ category: cat, items }));
  }, [photos]);

  const handlePhotoPress = useCallback(
    (photoId: string) => {
      const allIds = photos.filter((p) => !p.isDeleted).map((p) => p.id);
      navigation.navigate('Lightbox', { photoId, photoIds: allIds });
    },
    [photos, navigation],
  );

  if (categoryGroups.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Toolbar title="分类" />
        <EmptyState icon="tag" title="还没有分类" subtitle="AI 分析后自动归类照片" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Toolbar title="分类" />
      <FlashList
        data={categoryGroups}
        keyExtractor={(item) => item.category}
        estimatedItemSize={200}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const iconName = CATEGORY_ICON[item.category] || 'camera';
          const label = CATEGORY_LABELS[item.category] || item.category;
          return (
            <View style={styles.section}>
              {/* 分类标题 */}
              <View style={[styles.sectionHeader, { backgroundColor: theme.colors.surfaceVariant }]}>
                <LineIcon name={iconName} size={20} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  {label}
                </Text>
                <Text style={[styles.sectionCount, { color: theme.colors.onSurfaceVariant }]}>
                  {item.items.length} 张
                </Text>
              </View>
              {/* 该分类下的照片行 */}
              {Array.from({ length: Math.ceil(item.items.length / cols) }).map((_, rowIdx) => (
                <View key={rowIdx} style={[styles.row, { gap }]}>
                  {item.items.slice(rowIdx * cols, (rowIdx + 1) * cols).map((p) => (
                    <PhotoCard
                      key={p.id}
                      photo={p}
                      size={cardSize}
                      onPress={handlePhotoPress}
                    />
                  ))}
                </View>
              ))}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 80 },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 4,
    gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', flex: 1, color: '#2C3E35' },
  sectionCount: { fontSize: 13, color: '#5A7A6A' },
  row: { flexDirection: 'row', paddingHorizontal: 2, marginBottom: 2 },
});
