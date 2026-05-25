import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useMd3Theme } from '../theme';
import { usePhotoStore, useUiStore } from '../store';
import { useShallow } from 'zustand/react/shallow';
import type { RootStackScreenProps } from '../navigation/types';
import { Toolbar } from '../components/shared/Toolbar';
import { PhotoCard } from '../components/photo/PhotoCard';
import { EmptyState } from '../components/shared/EmptyState';
import type { Photo } from '../types';

export function FavoritesScreen({ navigation }: RootStackScreenProps<'Favorites'>) {
  const theme = useMd3Theme();
  const favorites = usePhotoStore(useShallow(s => s.photos.filter(p => !p.isDeleted && p.isFavorite)));
  const screenWidth = Dimensions.get('window').width;
  const cols = 3;
  const gap = 2;
  const cardSize = Math.floor((screenWidth - gap * 2 - gap * (cols - 1)) / cols);

  const handlePress = useCallback(
    (photoId: string) => {
      navigation.navigate('Lightbox', {
        photoId,
        photoIds: favorites.map((p) => p.id),
      });
    },
    [favorites, navigation],
  );

  const rows = useMemo(() => {
    const result: Photo[][] = [];
    for (let i = 0; i < favorites.length; i += cols) {
      result.push(favorites.slice(i, i + cols));
    }
    return result;
  }, [favorites]);

  if (favorites.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Toolbar title="收藏" showBack onBack={() => navigation.goBack()} />
        <EmptyState icon="heart" title="还没有收藏" subtitle="在照片上点按收藏即可出现在这里" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Toolbar title="收藏" subtitle={`${favorites.length} 张`} showBack onBack={() => navigation.goBack()} />
      <FlashList
        data={rows}
        keyExtractor={(_, idx) => `fav-${idx}`}
        estimatedItemSize={120}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: row }) => (
          <View style={[styles.row, { gap }]}>
            {row.map((p) => (
              <PhotoCard key={p.id} photo={p} size={cardSize} onPress={handlePress} />
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 2, paddingBottom: 80 },
  row: { flexDirection: 'row', marginBottom: 2 },
});
