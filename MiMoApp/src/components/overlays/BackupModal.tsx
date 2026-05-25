import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useMd3Theme } from '../../theme';
import { usePhotoStore } from '../../store';
import { useAlbumStore } from '../../store';
import { getBackupService } from '../../services/backup';
import type { BackupMeta, BackupProgress } from '../../services/backup';

type Tab = 'backup' | 'restore';

interface BackupModalProps {
  visible: boolean;
  onClose: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BackupModal({ visible, onClose }: BackupModalProps) {
  const theme = useMd3Theme();
  const photos = usePhotoStore((s) => s.photos);
  const albums = useAlbumStore((s) => s.albums);

  const [tab, setTab] = useState<Tab>('backup');
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<BackupProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activePhotos = photos.filter((p) => !p.isDeleted);

  const loadBackups = useCallback(async () => {
    try {
      const service = getBackupService();
      const list = await service.listBackups();
      setBackups(list);
    } catch {
      setBackups([]);
    }
  }, []);

  useEffect(() => {
    if (visible && tab === 'restore') {
      loadBackups();
    }
  }, [visible, tab, loadBackups]);

  const handleBackup = async () => {
    setLoading(true);
    setProgress(null);
    setError(null);

    try {
      const service = getBackupService();
      await service.exportBackup(undefined, setProgress);
      await loadBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : '备份失败');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const handleRestore = async (id: string) => {
    setLoading(true);
    setProgress(null);
    setError(null);

    try {
      const service = getBackupService();
      await service.importBackup(id, setProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : '恢复失败');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const service = getBackupService();
      await service.deleteBackup(id);
      setBackups((prev) => prev.filter((b) => b.id !== id));
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>备份与恢复</Text>

          <View style={styles.tabRow}>
            <Pressable
              style={[
                styles.tab,
                tab === 'backup' && { backgroundColor: theme.colors.primaryContainer },
              ]}
              onPress={() => { setTab('backup'); setError(null); }}
            >
              <Text style={[styles.tabLabel, { color: tab === 'backup' ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }]}>
                备份
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                tab === 'restore' && { backgroundColor: theme.colors.secondaryContainer },
              ]}
              onPress={() => { setTab('restore'); setError(null); }}
            >
              <Text style={[styles.tabLabel, { color: tab === 'restore' ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant }]}>
                恢复
              </Text>
            </Pressable>
          </View>

          {tab === 'backup' ? (
            <View style={styles.tabContent}>
              <View style={[styles.statsRow, { backgroundColor: theme.colors.surfaceVariant }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>{activePhotos.length}</Text>
                  <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>照片</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>{albums.length}</Text>
                  <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>相册</Text>
                </View>
              </View>

              {progress && (
                <View style={styles.progressSection}>
                  <View style={[styles.progressBarBg, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { backgroundColor: theme.colors.primary, width: `${Math.round(progress.progress * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressMsg, { color: theme.colors.onSurfaceVariant }]}>
                    {progress.message}
                  </Text>
                </View>
              )}

              {error && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
              )}

              <Pressable
                style={[styles.actionBtn, { backgroundColor: theme.colors.primary }, loading && styles.btnDisabled]}
                onPress={handleBackup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                ) : (
                  <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]}>创建备份</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.tabContent}>
              {backups.length === 0 && !loading && (
                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>暂无备份</Text>
              )}

              {backups.map((b) => (
                <View key={b.id} style={[styles.backupItem, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <View style={styles.backupInfo}>
                    <Text style={[styles.backupLabel, { color: theme.colors.onSurface }]}>{b.label}</Text>
                    <Text style={[styles.backupDetail, { color: theme.colors.onSurfaceVariant }]}>
                      {formatSize(b.size)} · {b.photoCount} 张照片 · {b.albumCount} 个相册
                    </Text>
                  </View>
                  <View style={styles.backupActions}>
                    <Pressable
                      style={[styles.smallBtn, { backgroundColor: theme.colors.primaryContainer }, loading && styles.btnDisabled]}
                      onPress={() => handleRestore(b.id)}
                      disabled={loading}
                    >
                      <Text style={[styles.smallBtnText, { color: theme.colors.onPrimaryContainer }]}>恢复</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.smallBtn, { backgroundColor: theme.colors.errorContainer }, loading && styles.btnDisabled]}
                      onPress={() => handleDelete(b.id)}
                      disabled={loading}
                    >
                      <Text style={[styles.smallBtnText, { color: theme.colors.onErrorContainer }]}>删除</Text>
                    </Pressable>
                  </View>
                </View>
              ))}

              {progress && (
                <View style={styles.progressSection}>
                  <View style={[styles.progressBarBg, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { backgroundColor: theme.colors.primary, width: `${Math.round(progress.progress * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressMsg, { color: theme.colors.onSurfaceVariant }]}>
                    {progress.message}
                  </Text>
                </View>
              )}

              {error && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
              )}
            </View>
          )}

          <Pressable
            style={[styles.closeBtn, { backgroundColor: theme.colors.surfaceVariant }]}
            onPress={onClose}
          >
            <Text style={[styles.closeText, { color: theme.colors.onSurface }]}>关闭</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000066', padding: 24 },
  card: { width: '100%', borderRadius: 24, padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabLabel: { fontSize: 14, fontWeight: '600' },
  tabContent: { minHeight: 120, marginBottom: 16 },
  statsRow: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 16, gap: 24 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 2 },
  progressSection: { marginBottom: 12 },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressMsg: { fontSize: 12, marginTop: 6 },
  errorText: { fontSize: 13, marginBottom: 8 },
  actionBtn: { paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  actionBtnText: { fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 24 },
  backupItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 8 },
  backupInfo: { flex: 1 },
  backupLabel: { fontSize: 14, fontWeight: '600' },
  backupDetail: { fontSize: 12, marginTop: 2 },
  backupActions: { flexDirection: 'row', gap: 6 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  smallBtnText: { fontSize: 12, fontWeight: '600' },
  closeBtn: { paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  closeText: { fontSize: 15, fontWeight: '600' },
});
