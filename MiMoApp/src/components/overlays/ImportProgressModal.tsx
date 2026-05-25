import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useMd3Theme } from '../../theme';
import type { ImportProgress } from '../../services/photoImport';

interface ImportProgressModalProps {
  visible: boolean;
  progress: ImportProgress | null;
  importedCount: number;
  onComplete: () => void;
  onCancel: () => void;
}

export function ImportProgressModal({
  visible,
  progress,
  importedCount,
  onComplete,
  onCancel,
}: ImportProgressModalProps) {
  const theme = useMd3Theme();
  const progressSv = useSharedValue(0);
  const isComplete = progress?.phase === 'complete';

  useEffect(() => {
    if (!visible) {
      progressSv.value = 0;
      return;
    }
    const ratio = progress && progress.total > 0 ? progress.current / progress.total : 0;
    progressSv.value = withTiming(ratio, { duration: 200 });
  }, [progress, visible, progressSv]);

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progressSv.value }],
  }));

  if (!visible) return null;

  const current = progress?.current ?? 0;
  const total = progress?.total ?? 0;
  const currentFile = progress?.currentFile ?? '';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          {isComplete ? (
            <>
              <Text style={styles.doneIcon}>✅</Text>
              <Text style={[styles.doneTitle, { color: theme.colors.onSurface }]}>
                导入完成
              </Text>
              <Text style={[styles.doneSub, { color: theme.colors.onSurfaceVariant }]}>
                成功导入 {importedCount} 张照片
              </Text>
              <Pressable
                style={[styles.doneBtn, { backgroundColor: theme.colors.primary }]}
                onPress={onComplete}
              >
                <Text style={[styles.doneBtnText, { color: theme.colors.onPrimary }]}>完成</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.icon}>📥</Text>
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                正在导入照片
              </Text>
              <Text style={[styles.fileName, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                {currentFile || '...'}
              </Text>
              {total > 0 && (
                <Text style={[styles.counter, { color: theme.colors.onSurfaceVariant }]}>
                  {current} / {total}
                </Text>
              )}

              <View style={[styles.progressBar, { backgroundColor: theme.colors.outlineVariant }]}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    { backgroundColor: theme.colors.primary },
                    progressStyle,
                  ]}
                />
              </View>

              <Pressable
                style={[styles.cancelBtn, { backgroundColor: theme.colors.surface }]}
                onPress={onCancel}
              >
                <Text style={[styles.cancelText, { color: theme.colors.error }]}>取消</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  fileName: { fontSize: 12, marginBottom: 8, maxWidth: '100%' },
  counter: { fontSize: 13, fontWeight: '500', marginBottom: 16 },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    width: '100%',
    transformOrigin: 'left',
  },
  cancelBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cancelText: { fontSize: 14, fontWeight: '600' },
  doneIcon: { fontSize: 48, marginBottom: 12 },
  doneTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  doneSub: { fontSize: 13, marginBottom: 20 },
  doneBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
  },
  doneBtnText: { fontSize: 15, fontWeight: '600' },
});
