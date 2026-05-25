import React, { useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Dimensions,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useMd3Theme } from '../theme';
import { usePhotoStore, useUiStore } from '../store';
import { useShallow } from 'zustand/react/shallow';
import { TRASH } from '../utils/constants';
import { formatRelative } from '../utils/date';
import type { TabScreenProps } from '../navigation/types';
import { Toolbar } from '../components/shared/Toolbar';
import { PhotoCard } from '../components/photo/PhotoCard';
import { EmptyState } from '../components/shared/EmptyState';
import type { Photo } from '../types';

export function TrashScreen({ navigation }: TabScreenProps<'PhotosTab'>) {
  const theme = useMd3Theme();
  const deletedPhotos = usePhotoStore(useShallow(s => s.photos.filter(p => p.isDeleted).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0))));
  const updatePhoto = usePhotoStore((s) => s.updatePhoto);
  const removePhotos = usePhotoStore((s) => s.removePhotos);
  const showToast = useUiStore((s) => s.showToast);
  const screenWidth = Dimensions.get('window').width;
  const cols = 3;
  const gap = 2;
  const cardSize = Math.floor((screenWidth - gap * 2 - gap * (cols - 1)) / cols);

  const handleRestore = useCallback(
    (photo: Photo) => {
      updatePhoto(photo.id, { isDeleted: false, deletedAt: undefined });
      showToast('已恢复', 'success');
    },
    [updatePhoto, showToast],
  );

  const handlePermanentDelete = useCallback(
    (photo: Photo) => {
      Alert.alert('彻底删除', '删除后无法恢复，确认删除？', [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            removePhotos([photo.id]);
            showToast('已彻底删除', 'info');
          },
        },
      ]);
    },
    [removePhotos, showToast],
  );

  const handlePress = useCallback(
    (photoId: string) => {
      navigation.navigate('Lightbox', {
        photoId,
        photoIds: deletedPhotos.map((dp) => dp.id),
      });
    },
    [deletedPhotos, navigation],
  );

  const handleEmptyTrash = useCallback(() => {
    Alert.alert('清空回收站', '将彻底删除回收站内所有照片', [
      { text: '取消', style: 'cancel' },
      {
        text: '全部删除',
        style: 'destructive',
        onPress: () => {
          removePhotos(deletedPhotos.map((p) => p.id));
          showToast('回收站已清空', 'info');
        },
      },
    ]);
  }, [deletedPhotos, removePhotos, showToast]);

  const daysLeft = (deletedAt: number) => {
    const elapsed = Math.floor((Date.now() - deletedAt) / (1000 * 60 * 60 * 24));
    return Math.max(0, TRASH.AUTO_DELETE_DAYS - elapsed);
  };

  if (deletedPhotos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Toolbar title="回收站" />
        <EmptyState icon="trash" title="回收站为空" subtitle={'删除的照片将在 ' + TRASH.AUTO_DELETE_DAYS + ' 天后自动清除'} />
      </View>
    );
  }

  // 行布局
  const rows = useMemo(() => {
    const result: Photo[][] = [];
    for (let i = 0; i < deletedPhotos.length; i += cols) {
      result.push(deletedPhotos.slice(i, i + cols));
    }
    return result;
  }, [deletedPhotos]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Toolbar
        title="回收站"
        subtitle={`${deletedPhotos.length} 项 · ${TRASH.AUTO_DELETE_DAYS} 天后自动清除`}
      />
      <FlashList
        data={rows}
        keyExtractor={(_, idx) => `tr-${idx}`}
        estimatedItemSize={140}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          deletedPhotos.length > 0 ? (
            <Pressable
              style={[styles.emptyBtn, { borderColor: theme.colors.error }]}
              onPress={handleEmptyTrash}
            >
              <Text style={[styles.emptyBtnText, { color: theme.colors.error }]}>清空回收站</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item: row }: { item: Photo[] }) => (
          <View style={styles.row}>
            {row.map((p) => (
              <View key={p.id}>
                <View style={styles.trashItem}>
                  <PhotoCard
                    photo={p}
                    size={cardSize}
                    onPress={handlePress}
                  />
                  {/* 操作栏 */}
                  <View style={[styles.overlay, { backgroundColor: '#00000099' }]}>
                    <Text style={styles.overlayText}>剩余 {daysLeft(p.deletedAt || 0)} 天</Text>
                    <View style={styles.overlayBtns}>
                      <Pressable
                        style={[styles.miniBtn, { backgroundColor: theme.colors.primary }]}
                        onPress={() => handleRestore(p)}
                      >
                        <Text style={styles.miniBtnText}>恢复</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.miniBtn, { backgroundColor: theme.colors.error }]}
                        onPress={() => handlePermanentDelete(p)}
                      >
                        <Text style={styles.miniBtnText}>删除</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            ))}
            {row.length < cols &&
              Array.from({ length: cols - row.length }).map((_, i) => (
                <View key={`ph-${i}`} style={{ width: cardSize }} />
              ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 80 },
  row: { flexDirection: 'row', gap: 2, paddingHorizontal: 2, marginBottom: 2 },
  trashItem: { position: 'relative' },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  overlayText: { color: '#fff', fontSize: 10, textAlign: 'center', marginBottom: 4 },
  overlayBtns: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  miniBtn: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  miniBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  emptyBtn: {
    borderWidth: 0,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 10,
    alignSelf: 'center',
    marginVertical: 12,
    backgroundColor: '#F9DEDC',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '600' },
});
