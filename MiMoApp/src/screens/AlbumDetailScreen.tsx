import React, { useMemo, useCallback, useState } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useMd3Theme } from '../theme';
import { useAlbumStore, usePhotoStore } from '../store';
import { usePhotoImport } from '../hooks/usePhotoImport';
import type { RootStackScreenProps } from '../navigation/types';
import { Toolbar } from '../components/shared/Toolbar';
import { PhotoCard } from '../components/photo/PhotoCard';
import { EmptyState } from '../components/shared/EmptyState';
import { PhotoPickerDialog } from '../components/albums/PhotoPickerDialog';
import { ImportProgressModal } from '../components/overlays/ImportProgressModal';
import { LineIcon } from '../components/shared/LineIcon';
import type { Photo } from '../types';

export function AlbumDetailScreen({ route, navigation }: RootStackScreenProps<'AlbumDetail'>) {
  const { albumId } = route.params;
  const theme = useMd3Theme();
  const album = useAlbumStore((s) => s.albums.find((a) => a.id === albumId));
  const photos = usePhotoStore((s) => s.photos);
  const { isImporting, progress, importFromGallery, cancelImport } = usePhotoImport();
  const [pickerVisible, setPickerVisible] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const cols = 3;
  const gap = 2;
  const cardSize = Math.floor((screenWidth - gap * 2 - gap * (cols - 1)) / cols);

  const albumPhotos = useMemo(() => {
    if (!album) return [];
    return album.photoIds
      .map((id) => photos.find((p) => p.id === id))
      .filter(Boolean) as Photo[];
  }, [album, photos]);

  const handlePress = useCallback(
    (photoId: string) => {
      navigation.navigate('Lightbox', {
        photoId,
        photoIds: albumPhotos.map((p) => p.id),
      });
    },
    [albumPhotos, navigation],
  );

  const handleImportAndAdd = useCallback(() => {
    importFromGallery();
  }, [importFromGallery]);

  if (!album) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Toolbar title="相册" showBack onBack={() => navigation.goBack()} />
        <EmptyState title="相册不存在" />
      </View>
    );
  }

  const rows = (() => {
    const result: Photo[][] = [];
    for (let i = 0; i < albumPhotos.length; i += cols) {
      result.push(albumPhotos.slice(i, i + cols));
    }
    return result;
  })();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Toolbar
        title={album.name}
        subtitle={`${album.photoCount} 张${album.isSmart ? ' · 智能相册' : ''}`}
        showBack
        onBack={() => navigation.goBack()}
        actions={
          <View style={styles.toolbarActions}>
            <Pressable style={styles.actionBtn} onPress={() => setPickerVisible(true)}>
              <LineIcon name="image" size={22} color={theme.colors.primary} />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={handleImportAndAdd}>
              <LineIcon name="plus" size={22} color={theme.colors.primary} />
            </Pressable>
          </View>
        }
      />
      {albumPhotos.length === 0 ? (
        <EmptyState icon="image" title="相册为空" subtitle="点击 + 添加照片到相册" />
      ) : (
        <FlashList
          data={rows}
          keyExtractor={(_, idx) => `ad-${idx}`}
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
      )}
      <PhotoPickerDialog
        visible={pickerVisible}
        albumId={albumId}
        onClose={() => setPickerVisible(false)}
      />
      <ImportProgressModal
        visible={isImporting}
        progress={progress}
        importedCount={progress?.current ?? 0}
        onComplete={cancelImport}
        onCancel={cancelImport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 2, paddingBottom: 80 },
  row: { flexDirection: 'row', marginBottom: 2 },
  toolbarActions: { flexDirection: 'row', gap: 4 },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
