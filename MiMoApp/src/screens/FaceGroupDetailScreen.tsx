import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useMd3Theme } from '../theme';
import { LineIcon } from '../components/shared/LineIcon';
import { usePhotoStore } from '../store';
import { getFaceClusterService } from '../services/faceCluster';
import { Toolbar } from '../components/shared/Toolbar';
import { EmptyState } from '../components/shared/EmptyState';
import type { RootStackScreenProps } from '../navigation/types';
import type { Photo } from '../types';

export function FaceGroupDetailScreen({ route, navigation }: RootStackScreenProps<'FaceGroupDetail'>) {
  const { groupId } = route.params;
  const theme = useMd3Theme();
  const { width: screenWidth } = useWindowDimensions();
  const photos = usePhotoStore((s) => s.photos);

  const group = useMemo(() => {
    const service = getFaceClusterService();
    service.cluster(photos);
    return service.getGroupById(groupId);
  }, [photos, groupId]);

  const groupPhotos = useMemo(() => {
    if (!group) return [];
    const photoMap = new Map(photos.map((p) => [p.id, p]));
    return group.photoIds
      .map((id) => photoMap.get(id))
      .filter((p): p is Photo => p != null && !p.isDeleted);
  }, [photos, group]);

  const gridColumns = 3;
  const gap = 3;
  const cardSize = (screenWidth - 16 - gap * (gridColumns - 1)) / gridColumns;

  const handlePhotoPress = (photo: Photo) => {
    const photoIds = groupPhotos.map((p) => p.id);
    navigation.navigate('Lightbox', { photoId: photo.id, photoIds });
  };

  if (!group || groupPhotos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Toolbar title="人物详情" showBack onBack={() => navigation.goBack()} />
        <EmptyState icon="user" title="暂无人脸数据" subtitle="运行 AI 人脸检测后显示" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Toolbar
        title={`${group.name || '未命名'} (${groupPhotos.length}张)`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <FlashList
        data={groupPhotos}
        keyExtractor={(item) => item.id}
        numColumns={gridColumns}
        estimatedItemSize={140}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.card,
              {
                width: cardSize,
                height: cardSize,
                marginBottom: gap,
                marginRight: gap,
                backgroundColor: item.color || theme.colors.surfaceVariant,
                borderRadius: 10,
                overflow: 'hidden',
              },
            ]}
            onPress={() => handlePhotoPress(item)}
          >
            {item.thumbnailUri ? (
              <Image
                source={{ uri: item.thumbnailUri }}
                style={styles.thumb}
                resizeMode="cover"
              />
            ) : (
              <LineIcon name="user" size={24} color={theme.colors.onSurfaceVariant} />
            )}
            {item.faceCount != null && item.faceCount > 0 && (
              <View style={[styles.faceBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.faceBadgeText}>{item.faceCount}人</Text>
              </View>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumb: { width: '100%', height: '100%' },
  faceBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  faceBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
});
