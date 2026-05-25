import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMd3Theme } from '../../theme';
import { useUiStore, usePhotoStore } from '../../store';
import { findDuplicates } from '../../ai/dedup';
import type { DedupResult } from '../../ai/dedup';
import { PhotoCard } from '../photo/PhotoCard';
import { EmptyState } from '../shared/EmptyState';

export function DedupOverlay() {
  const insets = useSafeAreaInsets();
  const isVisible = useUiStore((s) => s.isDedupOverlayVisible);

  if (!isVisible) return null;

  return <DedupOverlayContent />;
}

function DedupOverlayContent() {
  const insets = useSafeAreaInsets();
  const theme = useMd3Theme();
  const isVisible = useUiStore((s) => s.isDedupOverlayVisible);
  const setVisible = useUiStore((s) => s.setDedupOverlayVisible);
  const showToast = useUiStore((s) => s.showToast);
  const photos = usePhotoStore((s) => s.photos);
  const updatePhoto = usePhotoStore((s) => s.updatePhoto);

  const [result, setResult] = useState<DedupResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = useCallback(() => {
    const active = photos.filter((p) => !p.isDeleted);
    if (active.length < 2) {
      showToast('照片太少，无法去重', 'warning');
      return;
    }
    setIsScanning(true);
    // 延迟一帧让 UI 更新
    setTimeout(() => {
      const r = findDuplicates(active, 0.85);
      setResult(r);
      setIsScanning(false);
      showToast(
        r.duplicates.length > 0
          ? `发现 ${r.duplicates.length} 组重复照片`
          : '未发现重复照片',
        r.duplicates.length > 0 ? 'warning' : 'success',
      );
    }, 500);
  }, [photos, showToast]);

  const handleMarkDuplicate = useCallback(
    (duplicateId: string, originalId: string) => {
      updatePhoto(duplicateId, { duplicateOfId: originalId });
      showToast('已标记为重复', 'info');
      // 刷新结果
      if (result) {
        setResult({
          duplicates: result.duplicates.filter(
            (d) => d.duplicate.id !== duplicateId,
          ),
        });
      }
    },
    [updatePhoto, showToast, result],
  );

  const duplicates = result?.duplicates || [];

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setVisible(false)}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* 顶部栏 */}
        <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: theme.colors.outlineVariant }]}>
          <Pressable onPress={() => setVisible(false)}>
            <Text style={[styles.closeBtn, { color: theme.colors.primary }]}>关闭</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>去重扫描</Text>
          <Pressable onPress={handleScan} disabled={isScanning}>
            <Text style={[styles.scanBtn, { color: isScanning ? theme.colors.outline : theme.colors.primary }]}>
              {isScanning ? '扫描中...' : '开始扫描'}
            </Text>
          </Pressable>
        </View>

        {/* 内容 */}
        {duplicates.length === 0 && !isScanning ? (
          <EmptyState
            icon="scan"
            title={result ? '未发现重复' : '点击"开始扫描"检测重复照片'}
            subtitle="基于感知哈希 + 特征向量相似度"
          />
        ) : (
          <FlashList
            data={duplicates}
            keyExtractor={(item, idx) => `dup-${idx}`}
            estimatedItemSize={200}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={[styles.dupGroup, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.similarity, { color: theme.colors.onSurfaceVariant }]}>
                  相似度: {(item.similarity * 100).toFixed(1)}%
                </Text>
                <View style={styles.dupRow}>
                  <View style={styles.dupCard}>
                    <PhotoCard
                      photo={item.original}
                      size={120}
                      onPress={() => setVisible(false)}
                    />
                    <Text style={[styles.dupLabel, { color: theme.colors.primary }]}>原图</Text>
                  </View>
                  <Text style={[styles.vs, { color: theme.colors.outline }]}>→</Text>
                  <View style={styles.dupCard}>
                    <PhotoCard
                      photo={item.duplicate}
                      size={120}
                      onPress={() => setVisible(false)}
                    />
                    <Text style={[styles.dupLabel, { color: theme.colors.error }]}>重复</Text>
                  </View>
                </View>
                <Pressable
                  style={[styles.markBtn, { backgroundColor: theme.colors.errorContainer }]}
                  onPress={() => handleMarkDuplicate(item.duplicate.id, item.original.id)}
                >
                  <Text style={[styles.markBtnText, { color: theme.colors.onErrorContainer }]}>
                    标记为重复
                  </Text>
                </Pressable>
              </View>
            )}
          />
        )}
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
  closeBtn: { fontSize: 15 },
  title: { fontSize: 17, fontWeight: '700' },
  scanBtn: { fontSize: 15, fontWeight: '600' },
  listContent: { padding: 16, paddingBottom: 80 },
  dupGroup: { borderRadius: 16, padding: 12, marginBottom: 16 },
  similarity: { fontSize: 13, textAlign: 'center', marginBottom: 8 },
  dupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 },
  dupCard: { alignItems: 'center' },
  dupLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  vs: { fontSize: 20 },
  markBtn: { marginTop: 12, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  markBtnText: { fontSize: 13, fontWeight: '600' },
});
