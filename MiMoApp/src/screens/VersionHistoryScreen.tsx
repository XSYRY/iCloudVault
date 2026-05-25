import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMd3Theme } from '../theme';
import { usePhotoStore, useUiStore } from '../store';
import { formatRelative } from '../utils/date';
import type { EditVersion } from '../types';
import type { RootStackScreenProps } from '../navigation/types';
import { Toolbar } from '../components/shared/Toolbar';
import { EmptyState } from '../components/shared/EmptyState';

// ============================================================
// VersionHistoryScreen — 浏览/恢复编辑版本
// ============================================================

export function VersionHistoryScreen({ route, navigation }: RootStackScreenProps<'VersionHistory'>) {
  const insets = useSafeAreaInsets();
  const { photoId } = route.params;
  const theme = useMd3Theme();
  const photo = usePhotoStore((s) => s.photos.find((p) => p.id === photoId));
  const updatePhoto = usePhotoStore((s) => s.updatePhoto);
  const showToast = useUiStore((s) => s.showToast);

  const versions = photo?.versions || [];

  const handleRestore = (version: EditVersion) => {
    Alert.alert('恢复版本', `恢复到 ${version.description}？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '恢复',
        onPress: () => {
          showToast('版本已恢复', 'success');
          navigation.goBack();
        },
      },
    ]);
  };

  const handleDelete = (version: EditVersion) => {
    if (!photo) return;
    Alert.alert('删除版本', '此操作不可恢复', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          updatePhoto(photo.id, {
            versions: versions.filter((v) => v.id !== version.id),
          });
          showToast('版本已删除', 'info');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: theme.colors.outlineVariant }]}>
        <Pressable onPress={navigation.goBack}>
          <Text style={[styles.closeBtn, { color: theme.colors.primary }]}>关闭</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>版本历史</Text>
        <View style={{ width: 48 }} />
      </View>

      {versions.length === 0 ? (
        <EmptyState icon="file-text" title="暂无编辑版本" subtitle="编辑照片后会自动保存版本" />
      ) : (
        <FlashList
          data={[...versions].reverse()}
          keyExtractor={(item) => item.id}
          estimatedItemSize={90}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.versionCard,
                { backgroundColor: theme.colors.surfaceVariant },
                index === 0 && styles.latestCard,
              ]}
            >
              {/* 缩略图 */}
              <View style={styles.thumbWrap}>
                <Image
                  source={{ uri: item.thumbnailUri }}
                  style={styles.thumb}
                  resizeMode="cover"
                />
                {index === 0 && (
                  <View style={[styles.latestBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.latestText}>当前</Text>
                  </View>
                )}
              </View>

              {/* 信息 */}
              <View style={styles.info}>
                <Text style={[styles.desc, { color: theme.colors.onSurface }]}>
                  {item.description}
                </Text>
                <Text style={[styles.time, { color: theme.colors.onSurfaceVariant }]}>
                  {formatRelative(new Date(item.timestamp).toISOString())}
                </Text>
              </View>

              {/* 操作 */}
              <View style={styles.actions}>
                {index > 0 && (
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: theme.colors.primaryContainer }]}
                    onPress={() => handleRestore(item)}
                  >
                    <Text style={[styles.actionText, { color: theme.colors.onPrimaryContainer }]}>
                      恢复
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: theme.colors.errorContainer }]}
                  onPress={() => handleDelete(item)}
                >
                  <Text style={[styles.actionText, { color: theme.colors.onErrorContainer }]}>
                    删除
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
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
  closeBtn: { fontSize: 15 },
  title: { fontSize: 17, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 80 },
  versionCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  latestCard: {
    borderWidth: 0,
    borderColor: '#2C3E35',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  thumbWrap: { position: 'relative' },
  thumb: { width: 64, height: 64, borderRadius: 16 },
  latestBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  latestText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  info: { flex: 1, marginHorizontal: 12 },
  desc: { fontSize: 14, fontWeight: '600' },
  time: { fontSize: 12, marginTop: 4 },
  actions: { gap: 6 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionText: { fontSize: 12, fontWeight: '600' },
});
