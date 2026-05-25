import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMd3Theme } from '../../theme';
import { usePhotoStore, useAlbumStore, useUiStore } from '../../store';
import { PhotoCard } from '../photo/PhotoCard';
import type { Photo } from '../../types';

interface PhotoPickerDialogProps {
  visible: boolean;
  albumId: string;
  onClose: () => void;
}

export function PhotoPickerDialog({ visible, albumId, onClose }: PhotoPickerDialogProps) {
  const insets = useSafeAreaInsets();
  const theme = useMd3Theme();
  const photos = usePhotoStore((s) => s.photos.filter((p) => !p.isDeleted));
  const addToAlbum = useAlbumStore((s) => s.addToAlbum);
  const showToast = useUiStore((s) => s.showToast);
  const screenWidth = Dimensions.get('window').width;
  const cardSize = Math.floor((screenWidth - 40) / 3);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const handleAdd = () => {
    if (selectedIds.size === 0) return;
    addToAlbum(albumId, [...selectedIds]);
    showToast(`已添加 ${selectedIds.size} 张照片`, 'success');
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: theme.colors.outlineVariant }]}>
          <Pressable onPress={onClose}>
            <Text style={[styles.headerBtn, { color: theme.colors.primary }]}>取消</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            选择照片 ({selectedIds.size})
          </Text>
          <Pressable onPress={handleAdd}>
            <Text
              style={[
                styles.headerBtn,
                { color: selectedIds.size > 0 ? theme.colors.primary : theme.colors.outline },
              ]}
            >
              添加
            </Text>
          </Pressable>
        </View>

        <FlashList
          data={photos}
          numColumns={3}
          keyExtractor={(item) => item.id}
          estimatedItemSize={120}
          contentContainerStyle={styles.grid}
          renderItem={({ item }: { item: Photo }) => (
            <PhotoCard
              photo={item}
              size={cardSize}
              selected={selectedIds.has(item.id)}
              onPress={toggle}
            />
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,

    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerBtn: { fontSize: 15, fontWeight: '500' },
  title: { fontSize: 16, fontWeight: '700' },
  grid: { padding: 8, paddingBottom: 80 },
});
