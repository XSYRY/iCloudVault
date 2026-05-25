import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useMd3Theme } from '../../theme';
import { LineIcon } from '../shared/LineIcon';
import { usePhotoStore } from '../../store';
import { formatFileSize } from '../../utils/image';

type ExportFormat = 'json' | 'csv';

interface DataExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DataExportModal({ visible, onClose }: DataExportModalProps) {
  const theme = useMd3Theme();
  const photos = usePhotoStore((s) => s.photos);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const activePhotos = photos.filter((p) => !p.isDeleted);
  const totalSize = activePhotos.reduce((s, p) => s + p.sizeBytes, 0);

  const handleExport = async (format: ExportFormat) => {
    setExporting(true);
    setResult(null);

    try {
      let output: string;

      if (format === 'json') {
        const data = activePhotos.map((p) => ({
          id: p.id,
          filename: p.filename,
          dateTaken: p.dateTaken,
          size: formatFileSize(p.sizeBytes),
          dimensions: `${p.width}×${p.height}`,
          location: p.locationName,
          category: p.aiCategory,
          tags: p.aiTags,
          rating: p.rating,
          isFavorite: p.isFavorite,
        }));
        output = JSON.stringify(data, null, 2);
      } else {
        const headers = 'ID,Filename,Date,Size,Width,Height,Location,Category,Tags,Rating,Favorite';
        const rows = activePhotos.map((p) =>
          [
            p.id,
            p.filename,
            p.dateTaken,
            p.sizeBytes,
            p.width,
            p.height,
            p.locationName ?? '',
            p.aiCategory ?? '',
            (p.aiTags ?? []).join(';'),
            p.rating,
            p.isFavorite ? '1' : '0',
          ].join(',')
        );
        output = [headers, ...rows].join('\n');
      }

      setResult(output);
    } catch {
      setResult('导出失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>导出数据</Text>
          <Text style={[styles.info, { color: theme.colors.onSurfaceVariant }]}>
            共 {activePhotos.length} 张照片 · {formatFileSize(totalSize)}
          </Text>

          {exporting ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
          ) : result ? (
            <View style={[styles.resultBox, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.resultText, { color: theme.colors.onSurface }]} numberOfLines={10}>
                {result.slice(0, 2000)}
              </Text>
            </View>
          ) : (
            <View style={styles.formats}>
              <Pressable
                style={[styles.formatBtn, { backgroundColor: theme.colors.primaryContainer }]}
                onPress={() => handleExport('json')}
              >
                <LineIcon name="file-json" size={28} color={theme.colors.onPrimaryContainer} />
                <Text style={[styles.formatLabel, { color: theme.colors.onPrimaryContainer }]}>JSON</Text>
              </Pressable>
              <Pressable
                style={[styles.formatBtn, { backgroundColor: theme.colors.secondaryContainer }]}
                onPress={() => handleExport('csv')}
              >
                <LineIcon name="bar-chart" size={28} color={theme.colors.onSecondaryContainer} />
                <Text style={[styles.formatLabel, { color: theme.colors.onSecondaryContainer }]}>CSV</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            style={[styles.closeBtn, { backgroundColor: theme.colors.surfaceVariant }]}
            onPress={() => { setResult(null); onClose(); }}
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
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  info: { fontSize: 13, marginBottom: 20 },
  formats: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  formatBtn: { flex: 1, paddingVertical: 20, borderRadius: 16, alignItems: 'center', gap: 8 },
  formatLabel: { fontSize: 15, fontWeight: '600' },
  loader: { marginVertical: 24 },
  resultBox: { borderRadius: 12, padding: 12, marginBottom: 16, maxHeight: 200 },
  resultText: { fontSize: 11, fontFamily: 'monospace' },
  closeBtn: { paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  closeText: { fontSize: 15, fontWeight: '600' },
});
