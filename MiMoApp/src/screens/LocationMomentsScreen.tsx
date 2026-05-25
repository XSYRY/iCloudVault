import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMd3Theme } from '../theme';
import { usePhotoStore, useUiStore } from '../store';
import type { RootStackScreenProps } from '../navigation/types';
import type { Photo } from '../types';
import { LineIcon } from '../components/shared/LineIcon';

function formatDate(dateTaken: string, timeTaken: string) {
  return `${dateTaken.replace(/-/g, '.')} ${timeTaken.slice(0, 5)}`;
}

export function LocationMomentsScreen({
  route,
  navigation,
}: RootStackScreenProps<'LocationMoments'>) {
  const { location, photoIds, initialPhotoId } = route.params;
  const insets = useSafeAreaInsets();
  const theme = useMd3Theme();
  const photos = usePhotoStore((s) => s.photos);
  const updatePhoto = usePhotoStore((s) => s.updatePhoto);
  const showToast = useUiStore((s) => s.showToast);

  const locationPhotos = useMemo(
    () =>
      photoIds
        .map((id) => photos.find((photo) => photo.id === id))
        .filter(Boolean) as Photo[],
    [photoIds, photos],
  );

  const initialSelectedId =
    initialPhotoId && locationPhotos.some((photo) => photo.id === initialPhotoId)
      ? initialPhotoId
      : locationPhotos[0]?.id;
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | undefined>(initialSelectedId);
  const [draftMemo, setDraftMemo] = useState('');

  useEffect(() => {
    if (!selectedPhotoId && locationPhotos[0]) {
      setSelectedPhotoId(locationPhotos[0].id);
    }
  }, [locationPhotos, selectedPhotoId]);

  const selectedPhoto = useMemo(
    () => locationPhotos.find((photo) => photo.id === selectedPhotoId) ?? locationPhotos[0],
    [locationPhotos, selectedPhotoId],
  );

  const memoPhotos = useMemo(
    () =>
      locationPhotos
        .filter((photo) => photo.memo?.trim())
        .sort((a, b) => b.createdAt - a.createdAt),
    [locationPhotos],
  );

  useEffect(() => {
    setDraftMemo(selectedPhoto?.memo ?? '');
  }, [selectedPhoto?.id]);

  const handleSaveMemo = useCallback(() => {
    if (!selectedPhoto) return;
    updatePhoto(selectedPhoto.id, { memo: draftMemo });
    showToast(draftMemo.trim() ? '随记已保存' : '已清空随记', 'success');
  }, [draftMemo, selectedPhoto, showToast, updatePhoto]);

  const openLightbox = useCallback(
    (photo: Photo) => {
      navigation.navigate('Lightbox', {
        photoId: photo.id,
        photoIds,
      });
    },
    [navigation, photoIds],
  );

  if (!selectedPhoto) {
    return (
      <View style={[styles.emptyRoot, { backgroundColor: theme.colors.background }]}>
        <Pressable
          style={[styles.backBtn, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
        >
          <LineIcon name="chevron-left" size={22} color={theme.colors.onSurface} />
        </Pressable>
        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
          这个地点还没有可展示的照片
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
              <LineIcon name="chevron-left" size={22} color={theme.colors.onSurface} />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                {location}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {locationPhotos.length} 张照片 · {memoPhotos.length} 条随记
              </Text>
            </View>

            <Pressable
              style={styles.headerBtn}
              onPress={() => openLightbox(selectedPhoto)}
            >
              <LineIcon name="arrow-up-right" size={18} color={theme.colors.onSurface} />
            </Pressable>
          </View>

          <View style={styles.heroWrap}>
            <Pressable onPress={() => openLightbox(selectedPhoto)}>
              <Image
                source={{ uri: selectedPhoto.uri }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </Pressable>
            <View
              style={[
                styles.heroMeta,
                { backgroundColor: theme.colors.surfaceContainerLow },
              ]}
            >
              <Text style={[styles.heroMetaTitle, { color: theme.colors.onSurface }]}>
                当前照片
              </Text>
              <Text
                style={[styles.heroMetaSub, { color: theme.colors.onSurfaceVariant }]}
              >
                {formatDate(selectedPhoto.dateTaken, selectedPhoto.timeTaken)}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbRow}
          >
            {locationPhotos.map((photo) => {
              const isActive = photo.id === selectedPhoto.id;
              return (
                <Pressable
                  key={photo.id}
                  style={[
                    styles.thumbCard,
                    {
                      borderColor: isActive
                        ? theme.colors.primary
                        : theme.colors.outlineVariant,
                      backgroundColor: isActive
                        ? theme.colors.primaryContainer
                        : theme.colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedPhotoId(photo.id)}
                >
                  <Image
                    source={{ uri: photo.thumbnailUri ?? photo.uri }}
                    style={styles.thumbImage}
                  />
                  {photo.memo?.trim() ? (
                    <View
                      style={[
                        styles.thumbMemoDot,
                        { backgroundColor: theme.colors.tertiary },
                      ]}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <View
            style={[
              styles.editorCard,
              { backgroundColor: theme.colors.surfaceContainerLow },
            ]}
          >
            <View style={styles.editorHeader}>
              <View>
                <Text style={[styles.editorTitle, { color: theme.colors.onSurface }]}>
                  给这张照片写随记
                </Text>
                <Text
                  style={[styles.editorSub, { color: theme.colors.onSurfaceVariant }]}
                >
                  这条内容会同步出现在足迹地图的这个地点下面
                </Text>
              </View>
              <Pressable
                style={[
                  styles.saveBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleSaveMemo}
              >
                <Text style={[styles.saveBtnText, { color: theme.colors.onPrimary }]}>
                  保存
                </Text>
              </Pressable>
            </View>

            <TextInput
              value={draftMemo}
              onChangeText={setDraftMemo}
              placeholder="写下这张照片当时的感受、故事或者提醒..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              multiline
              textAlignVertical="top"
              style={[
                styles.memoInput,
                {
                  color: theme.colors.onSurface,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            />
          </View>

          <View style={styles.memoSection}>
            <Text style={[styles.memoSectionTitle, { color: theme.colors.onSurface }]}>
              这个地点的随记
            </Text>

            {memoPhotos.length === 0 ? (
              <View
                style={[
                  styles.emptyMemoCard,
                  { backgroundColor: theme.colors.surfaceContainerLow },
                ]}
              >
                <LineIcon name="message" size={18} color={theme.colors.primary} />
                <Text
                  style={[styles.emptyMemoText, { color: theme.colors.onSurfaceVariant }]}
                >
                  还没有随记，先从上面的当前照片写第一条吧。
                </Text>
              </View>
            ) : (
              memoPhotos.map((photo) => (
                <Pressable
                  key={photo.id}
                  style={[
                    styles.memoItem,
                    { backgroundColor: theme.colors.surfaceContainerLow },
                  ]}
                  onPress={() => setSelectedPhotoId(photo.id)}
                >
                  <Image
                    source={{ uri: photo.thumbnailUri ?? photo.uri }}
                    style={styles.memoItemThumb}
                  />
                  <View style={styles.memoItemBody}>
                    <Text style={[styles.memoItemDate, { color: theme.colors.onSurfaceVariant }]}>
                      {formatDate(photo.dateTaken, photo.timeTaken)}
                    </Text>
                    <Text style={[styles.memoItemText, { color: theme.colors.onSurface }]}>
                      {photo.memo}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  emptyRoot: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14 },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 12,
  },
  heroWrap: {
    paddingHorizontal: 16,
  },
  heroImage: {
    width: '100%',
    height: 320,
    borderRadius: 28,
    backgroundColor: '#DDE8E0',
  },
  heroMeta: {
    marginTop: 10,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  heroMetaTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroMetaSub: {
    marginTop: 4,
    fontSize: 12,
  },
  thumbRow: {
    paddingHorizontal: 16,
    gap: 10,
    paddingTop: 16,
  },
  thumbCard: {
    width: 86,
    borderRadius: 20,
    borderWidth: 1,
    padding: 6,
  },
  thumbImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#DDE8E0',
  },
  thumbMemoDot: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  editorCard: {
    marginTop: 18,
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 16,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  editorTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  editorSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 240,
  },
  saveBtn: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  memoInput: {
    marginTop: 14,
    minHeight: 130,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    lineHeight: 20,
  },
  memoSection: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  memoSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  emptyMemoCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  emptyMemoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  memoItem: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 22,
    padding: 12,
    marginBottom: 10,
  },
  memoItemThumb: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#DDE8E0',
  },
  memoItemBody: {
    flex: 1,
  },
  memoItemDate: {
    fontSize: 11,
  },
  memoItemText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
  },
});
