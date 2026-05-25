import React from 'react';
import { View, Text, Image, StyleSheet, Pressable, Modal } from 'react-native';
import { useMd3Theme } from '../../theme';
import { LineIcon } from './LineIcon';
import type { Photo } from '../../types';

// ============================================================
// PeekOverlay — 长按照片的快速预览浮层（iOS Peek & Pop 风格）
// ============================================================

interface PeekOverlayProps {
  visible: boolean;
  photo: Photo | null;
  onClose: () => void;
  onOpen: () => void;
  onFavorite: () => void;
  onHide: () => void;
  onDelete: () => void;
}

export function PeekOverlay({
  visible,
  photo,
  onClose,
  onOpen,
  onFavorite,
  onHide,
  onDelete,
}: PeekOverlayProps) {
  const theme = useMd3Theme();

  if (!photo) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          {/* 大图预览 */}
          <View style={[styles.imageWrap, { backgroundColor: photo.color }]}>
            {photo.thumbnailUri && (
              <Image
                source={{ uri: photo.thumbnailUri }}
                style={styles.image}
                resizeMode="cover"
              />
            )}
          </View>

          {/* 照片信息 */}
          <View style={styles.info}>
            <Text style={[styles.filename, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {photo.filename}
            </Text>
            <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>
              {photo.dateTaken} · {photo.width}×{photo.height}
            </Text>
            {photo.aiCategory && (
              <View style={[styles.tag, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text style={[styles.tagText, { color: theme.colors.onPrimaryContainer }]}>
                  {photo.aiCategory}
                </Text>
              </View>
            )}
          </View>

          {/* 快速操作 */}
          <View style={styles.actions}>
            <QuickAction iconName="eye" label="查看" onPress={onOpen} />
            <QuickAction iconName="heart" label="收藏" onPress={onFavorite} />
            <QuickAction iconName="eye-off" label="隐藏" onPress={onHide} />
            <QuickAction iconName="trash" label="删除" onPress={onDelete} destructive />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

function QuickAction({
  iconName,
  label,
  onPress,
  destructive,
}: {
  iconName: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const theme = useMd3Theme();

  return (
    <Pressable style={styles.action} onPress={onPress}>
      <LineIcon name={iconName} size={20} color={destructive ? theme.colors.error : theme.colors.onSurface} />
      <Text
        style={[
          styles.actionLabel,
          { color: destructive ? theme.colors.error : theme.colors.onSurface },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000099',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  imageWrap: { width: '100%', height: 240 },
  image: { width: '100%', height: '100%' },
  info: { padding: 16 },
  filename: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13, marginTop: 4 },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 8,
  },
  tagText: { fontSize: 12, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#cccccc44',
    paddingVertical: 8,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionLabel: { fontSize: 11, fontWeight: '500' },
});
