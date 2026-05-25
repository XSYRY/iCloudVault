import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useMd3Theme } from '../../theme';
import { getPrintService } from '../../services/print';
import type { PrintLayout, PrintOptions } from '../../services/print';
import { PRINT_LAYOUTS } from '../../services/print';

const LAYOUT_KEYS: PrintLayout[] = ['4x6', '5x7', '8x10', 'a4', 'letter', 'square'];

const QUALITY_OPTIONS: { value: PrintOptions['quality']; label: string }[] = [
  { value: 'draft', label: '草稿' },
  { value: 'standard', label: '标准' },
  { value: 'high', label: '高质量' },
];

interface PrintModalProps {
  visible: boolean;
  photoUris: string[];
  onClose: () => void;
}

export function PrintModal({ visible, photoUris, onClose }: PrintModalProps) {
  const theme = useMd3Theme();

  const [layout, setLayout] = useState<PrintLayout>('4x6');
  const [quality, setQuality] = useState<PrintOptions['quality']>('standard');
  const [copies, setCopies] = useState(1);
  const [includeCaption, setIncludeCaption] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);

  const handlePrint = useCallback(async () => {
    if (photoUris.length === 0) return;

    const options: PrintOptions = { layout, quality, copies, includeCaption };
    const service = getPrintService();

    setPrinting(true);
    setProgress(0);
    setTotal(photoUris.length);

    try {
      if (photoUris.length === 1) {
        await service.print(photoUris[0], options);
        setProgress(1);
      } else {
        const count = await service.printMultiple(photoUris, options);
        setProgress(count);
      }
    } catch {
    } finally {
      setPrinting(false);
      onClose();
    }
  }, [photoUris, layout, quality, copies, includeCaption, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>打印照片</Text>

          {photoUris.length > 1 && (
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              已选择 {photoUris.length} 张照片
            </Text>
          )}

          <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>布局尺寸</Text>
          <View style={styles.layoutGrid}>
            {LAYOUT_KEYS.map((key) => {
              const info = PRINT_LAYOUTS[key];
              const selected = layout === key;
              return (
                <Pressable
                  key={key}
                  style={[
                    styles.layoutCard,
                    {
                      backgroundColor: selected
                        ? theme.colors.primaryContainer
                        : theme.colors.surfaceVariant,
                      borderColor: selected ? theme.colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => setLayout(key)}
                >
                  <Text
                    style={[
                      styles.layoutName,
                      {
                        color: selected
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurface,
                      },
                    ]}
                  >
                    {info.name}
                  </Text>
                  <Text
                    style={[
                      styles.layoutSize,
                      {
                        color: selected
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {info.widthInch}×{info.heightInch}"
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>打印质量</Text>
          <View style={styles.qualityRow}>
            {QUALITY_OPTIONS.map((opt) => {
              const selected = quality === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.qualityBtn,
                    {
                      backgroundColor: selected
                        ? theme.colors.secondaryContainer
                        : theme.colors.surfaceVariant,
                    },
                  ]}
                  onPress={() => setQuality(opt.value)}
                >
                  <Text
                    style={[
                      styles.qualityLabel,
                      {
                        color: selected
                          ? theme.colors.onSecondaryContainer
                          : theme.colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>份数</Text>
          <View style={styles.copiesRow}>
            <Pressable
              style={[styles.copiesBtn, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => setCopies((c) => Math.max(1, c - 1))}
              disabled={printing}
            >
              <Text style={[styles.copiesBtnText, { color: theme.colors.onSurface }]}>−</Text>
            </Pressable>
            <Text style={[styles.copiesValue, { color: theme.colors.onSurface }]}>{copies}</Text>
            <Pressable
              style={[styles.copiesBtn, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => setCopies((c) => Math.min(99, c + 1))}
              disabled={printing}
            >
              <Text style={[styles.copiesBtnText, { color: theme.colors.onSurface }]}>+</Text>
            </Pressable>
          </View>

          <View style={styles.captionRow}>
            <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>包含标题</Text>
            <Pressable
              style={[
                styles.toggle,
                {
                  backgroundColor: includeCaption
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
                },
              ]}
              onPress={() => setIncludeCaption((v) => !v)}
              disabled={printing}
            >
              <View
                style={[
                  styles.toggleThumb,
                  {
                    backgroundColor: includeCaption
                      ? theme.colors.onPrimary
                      : theme.colors.outline,
                    alignSelf: includeCaption ? 'flex-end' : 'flex-start',
                  },
                ]}
              />
            </Pressable>
          </View>

          {printing && (
            <View style={styles.progressRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
                正在打印 {progress}/{total}...
              </Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <Pressable
              style={[styles.cancelBtn, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={onClose}
              disabled={printing}
            >
              <Text style={[styles.cancelText, { color: theme.colors.onSurface }]}>取消</Text>
            </Pressable>
            <Pressable
              style={[
                styles.printBtn,
                { backgroundColor: theme.colors.primary },
                printing && styles.btnDisabled,
              ]}
              onPress={handlePrint}
              disabled={printing || photoUris.length === 0}
            >
              {printing ? (
                <ActivityIndicator size="small" color={theme.colors.onPrimary} />
              ) : (
                <Text style={[styles.printText, { color: theme.colors.onPrimary }]}>打印</Text>
              )}
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
    backgroundColor: '#00000066',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  layoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  layoutCard: {
    width: '30%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  layoutName: {
    fontSize: 13,
    fontWeight: '600',
  },
  layoutSize: {
    fontSize: 11,
    marginTop: 2,
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  qualityLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  copiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  copiesBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copiesBtnText: {
    fontSize: 20,
    fontWeight: '600',
  },
  copiesValue: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'center',
  },
  captionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  progressText: {
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  printBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  printText: {
    fontSize: 15,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
