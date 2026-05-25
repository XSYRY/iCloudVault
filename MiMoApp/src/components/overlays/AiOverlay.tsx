import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useMd3Theme } from '../../theme';
import { useUiStore, useAiStore, usePhotoStore } from '../../store';
import { getAiPipeline } from '../../ai/pipeline';
import { MlKitLabelProcessor, MlKitFaceProcessor, TfliteEmbeddingProcessor } from '../../ai/processors';
import { MockLabelProcessor, MockFaceProcessor, MockEmbeddingProcessor } from '../../ai/mockProcessors';

let useRealAi = true;

try {
  require('@react-native-ml-kit/image-labeling');
  require('@react-native-ml-kit/face-detection');
} catch {
  useRealAi = false;
}

const pipeline = getAiPipeline();

if (useRealAi) {
  pipeline.registerProcessor(new MlKitLabelProcessor());
  pipeline.registerProcessor(new MlKitFaceProcessor());
  pipeline.registerProcessor(new TfliteEmbeddingProcessor());
} else {
  pipeline.registerProcessor(new MockLabelProcessor());
  pipeline.registerProcessor(new MockFaceProcessor());
  pipeline.registerProcessor(new MockEmbeddingProcessor());
}

export function AiOverlay() {
  const isVisible = useUiStore((s) => s.isAiOverlayVisible);

  if (!isVisible) return null;

  return <AiOverlayContent />;
}

function AiOverlayContent() {
  const theme = useMd3Theme();
  const isVisible = useUiStore((s) => s.isAiOverlayVisible);
  const setVisible = useUiStore((s) => s.setAiOverlayVisible);
  const showToast = useUiStore((s) => s.showToast);
  const status = useAiStore((s) => s.status);
  const photos = usePhotoStore((s) => s.photos);

  useEffect(() => {
    if (!status.isRunning && status.queueSize > 0 && status.processedCount === status.queueSize) {
      showToast(`AI 分析完成，共处理 ${status.processedCount} 张照片`, 'success');
    }
  }, [status.isRunning, status.queueSize, status.processedCount, showToast]);

  const handleStart = () => {
    const unprocessed = photos.filter((p) => !p.isDeleted && !p.aiTags);
    if (unprocessed.length === 0) {
      showToast('所有照片已分析完毕', 'info');
      return;
    }
    pipeline.queuePhotos(unprocessed);
    showToast(`开始分析 ${unprocessed.length} 张照片`, 'success');
  };

  const handleStop = () => {
    pipeline.stop();
    showToast('AI 分析已暂停', 'info');
  };

  const progress = status.queueSize > 0
    ? Math.round((status.processedCount / status.queueSize) * 100)
    : 0;

  const engineLabel = useRealAi ? 'ML Kit（真实 AI）' : 'Mock（模拟）';
  const processorInfo = `已加载 ${pipeline.getProcessorCount()} 个处理器 · ${engineLabel}`;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <View style={[styles.backdrop, { backgroundColor: '#00000088' }]}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>AI 智能分析</Text>
          <Text style={[styles.desc, { color: theme.colors.onSurfaceVariant }]}>
            使用手机端 AI 为照片打标签、分类、检测人脸、提取嵌入向量
          </Text>
          <Text style={[styles.processorInfo, { color: theme.colors.outline }]}>
            {processorInfo}
          </Text>

          {status.isRunning && (
            <View style={styles.progressSection}>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: theme.colors.primary, width: `${progress}%` },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
                {status.processedCount}/{status.queueSize} · {progress}%
              </Text>
              {status.currentPhotoId && (
                <Text style={[styles.currentFile, { color: theme.colors.outline }]} numberOfLines={1}>
                  正在处理: {status.currentPhotoId}
                </Text>
              )}
            </View>
          )}

          {status.errors.length > 0 && (
            <View style={styles.errors}>
              <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
                {status.errors.length} 个分析失败
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              onPress={() => setVisible(false)}
              style={[styles.btn, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <Text style={[styles.btnText, { color: theme.colors.onSurface }]}>关闭</Text>
            </Pressable>
            <Pressable
              onPress={status.isRunning ? handleStop : handleStart}
              style={[
                styles.btn,
                {
                  backgroundColor: status.isRunning
                    ? theme.colors.errorContainer
                    : theme.colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.btnText,
                  {
                    color: status.isRunning
                      ? theme.colors.onErrorContainer
                      : theme.colors.onPrimary,
                  },
                ]}
              >
                {status.isRunning ? '暂停' : '开始分析'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    borderRadius: 28,
    padding: 24,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  processorInfo: { fontSize: 12, marginBottom: 20 },
  progressSection: { marginBottom: 16 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 13, marginTop: 8, textAlign: 'center' },
  currentFile: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  errors: { marginBottom: 12 },
  errorTitle: { fontSize: 13, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 12 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnText: { fontSize: 15, fontWeight: '600' },
});
