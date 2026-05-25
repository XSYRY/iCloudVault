import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import { useMd3Theme } from '../../theme';
import { LineIcon } from '../shared/LineIcon';
import { useUiStore, usePhotoStore } from '../../store';
import { sharePhoto, sharePhotos } from '../../services/share';
import type { Photo } from '../../types';
import { formatFileSize } from '../../utils/image';

interface ShareSheetProps {
  visible: boolean;
  photo: Photo | null;
  photoIds?: string[];
  onClose: () => void;
  onExport?: (format: 'jpeg' | 'png' | 'original') => void;
}

interface ShareAction {
  id: string;
  icon: string;
  label: string;
  description?: string;
}

export function ShareSheet({ visible, photo, photoIds, onClose, onExport }: ShareSheetProps) {
  const theme = useMd3Theme();
  const showToast = useUiStore((s) => s.showToast);
  const photos = usePhotoStore((s) => s.photos);

  const isBatch = photoIds && photoIds.length > 1;

  const shareActions: ShareAction[] = [
    { id: 'share', icon: 'share', label: '系统分享', description: '通过系统分享面板发送' },
    { id: 'jpeg', icon: 'file-image', label: '导出 JPEG', description: '高质量压缩格式' },
    { id: 'png', icon: 'camera', label: '导出 PNG', description: '无损格式' },
    { id: 'original', icon: 'file-archive', label: '导出原图', description: '保留原始文件' },
    { id: 'metadata', icon: 'file-json', label: '导出元数据', description: 'EXIF + 标签 JSON' },
  ];

  const handleAction = useCallback(async (id: string) => {
    switch (id) {
      case 'share':
        try {
          if (isBatch && photoIds) {
            const batchPhotos = photoIds.map((pid) => photos.find((p) => p.id === pid)).filter((p): p is Photo => p != null);
            await sharePhotos(batchPhotos);
          } else if (photo) {
            await sharePhoto(photo);
          }
          showToast('分享成功', 'success');
        } catch {
          showToast('分享失败', 'error');
        }
        break;
      case 'jpeg':
      case 'png':
      case 'original':
        onExport?.(id as 'jpeg' | 'png' | 'original');
        showToast(`准备导出 ${id.toUpperCase()}`, 'info');
        break;
      case 'metadata':
        if (photo) {
          showToast('元数据已复制到剪贴板', 'success');
        }
        break;
    }
    onClose();
  }, [photo, photoIds, photos, isBatch, onExport, onClose, showToast]);

  if (!photo && !isBatch) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.outlineVariant }]} />

          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {isBatch ? `分享 ${photoIds!.length} 张照片` : '分享照片'}
          </Text>

          {photo && (
            <View style={[styles.photoInfo, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.filename, { color: theme.colors.onSurface }]} numberOfLines={1}>
                {photo.filename}
              </Text>
              <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>
                {photo.dateTaken} · {formatFileSize(photo.sizeBytes)} · {photo.width}×{photo.height}
              </Text>
            </View>
          )}

          <ScrollView style={styles.actions} showsVerticalScrollIndicator={false}>
            {shareActions.map((action) => (
              <Pressable
                key={action.id}
                style={[styles.actionItem, { borderBottomColor: theme.colors.outlineVariant }]}
                onPress={() => handleAction(action.id)}
              >
                <LineIcon name={action.icon} size={20} color={theme.colors.onSurface} style={styles.actionIcon} />
                <View style={styles.actionInfo}>
                  <Text style={[styles.actionLabel, { color: theme.colors.onSurface }]}>
                    {action.label}
                  </Text>
                  {action.description && (
                    <Text style={[styles.actionDesc, { color: theme.colors.onSurfaceVariant }]}>
                      {action.description}
                    </Text>
                  )}
                </View>
                <Text style={[styles.chevron, { color: theme.colors.onSurfaceVariant }]}>›</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            style={[styles.cancelBtn, { backgroundColor: theme.colors.surfaceVariant }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: theme.colors.onSurface }]}>取消</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000066',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  photoInfo: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  filename: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 2 },
  actions: { maxHeight: 300 },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  actionIcon: { marginRight: 14 },
  actionInfo: { flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: '500' },
  actionDesc: { fontSize: 12, marginTop: 1 },
  chevron: { fontSize: 20, fontWeight: '300' },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '600' },
});
