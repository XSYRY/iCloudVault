import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Pressable, Text, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useMd3Theme } from '../theme';
import { usePhotoStore, useUiStore } from '../store';
import { useShallow } from 'zustand/react/shallow';
import type { RootStackScreenProps } from '../navigation/types';
import { Toolbar } from '../components/shared/Toolbar';
import { PhotoCard } from '../components/photo/PhotoCard';
import { EmptyState } from '../components/shared/EmptyState';
import type { Photo } from '../types';

export function HiddenScreen({ navigation }: RootStackScreenProps<'Hidden'>) {
  const theme = useMd3Theme();
  const hidden = usePhotoStore(useShallow(s => s.photos.filter(p => !p.isDeleted && p.isHidden)));
  const updatePhoto = usePhotoStore((s) => s.updatePhoto);
  const showToast = useUiStore((s) => s.showToast);
  const screenWidth = Dimensions.get('window').width;
  const cols = 3;
  const gap = 2;
  const cardSize = Math.floor((screenWidth - gap * 2 - gap * (cols - 1)) / cols);

  const handlePress = useCallback(
    (photoId: string) => {
      navigation.navigate('Lightbox', {
        photoId,
        photoIds: hidden.map((hp) => hp.id),
      });
    },
    [hidden, navigation],
  );

  const handleUnhide = useCallback(
    (photo: Photo) => {
      updatePhoto(photo.id, { isHidden: false });
      showToast('已取消隐藏', 'success');
    },
    [updatePhoto, showToast],
  );

  const rows = useMemo(() => {
    const result: Photo[][] = [];
    for (let i = 0; i < hidden.length; i += cols) {
      result.push(hidden.slice(i, i + cols));
    }
    return result;
  }, [hidden]);

  if (hidden.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Toolbar title="隐藏照片" showBack onBack={() => navigation.goBack()} />
        <EmptyState icon="eye-off" title="没有隐藏的照片" subtitle="长按照片可选择隐藏" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Toolbar title="隐藏照片" subtitle={`${hidden.length} 张`} showBack onBack={() => navigation.goBack()} />
      <FlashList
        data={rows}
        keyExtractor={(_, idx) => `hid-${idx}`}
        estimatedItemSize={120}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: row }) => (
          <View style={[styles.row, { gap }]}>
            {row.map((p) => (
              <View key={p.id}>
                <View style={{ opacity: 0.5 }}>
                  <PhotoCard photo={p} size={cardSize} onPress={handlePress} />
                </View>
                <Pressable
                  style={[styles.unhideBtn, { backgroundColor: theme.colors.primaryContainer }]}
                  onPress={() => handleUnhide(p)}
                >
                  <Text style={[styles.unhideText, { color: theme.colors.onPrimaryContainer }]}>
                    取消隐藏
                  </Text>
                </Pressable>
              </View>
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
  unhideBtn: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  unhideText: { fontSize: 11, fontWeight: '600' },
});
