import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { useUiStore, usePhotoStore } from '../../store';
import { formatFileSize } from '../../utils/image';
import { CATEGORY_LABELS, CATEGORY_ICON } from '../../utils/constants';
import type { Category } from '../../types';
import { LineIcon } from '../shared/LineIcon';

export function StatsModal() {
  const insets = useSafeAreaInsets();
  const isVisible = useUiStore((s) => s.isStatsModalVisible);

  if (!isVisible) return null;

  return <StatsModalContent />;
}

function StatsModalContent() {
  const insets = useSafeAreaInsets();
  const { md3Theme: theme } = useAppTheme();
  const isVisible = useUiStore((s) => s.isStatsModalVisible);
  const setVisible = useUiStore((s) => s.setStatsModalVisible);
  const photos = usePhotoStore((s) => s.photos);

  const stats = useMemo(() => {
    const active = photos.filter((p) => !p.isDeleted);
    const totalSize = active.reduce((sum, p) => sum + p.sizeBytes, 0);
    const avgSize = active.length > 0 ? totalSize / active.length : 0;
    const favCount = active.filter((p) => p.isFavorite).length;
    const hiddenCount = active.filter((p) => p.isHidden).length;
    const aiProcessedCount = active.filter((p) => p.aiTags !== null).length;
    const deletedCount = photos.filter((p) => p.isDeleted).length;

    // 按分类统计
    const categoryStats = new Map<Category, number>();
    for (const p of active) {
      const cat = p.aiCategory || 'other';
      categoryStats.set(cat, (categoryStats.get(cat) || 0) + 1);
    }

    return {
      total: active.length,
      totalSize,
      avgSize,
      favCount,
      hiddenCount,
      aiProcessedCount,
      deletedCount,
      categoryStats,
    };
  }, [photos]);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setVisible(false)}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: theme.colors.outlineVariant }]}>
          <Pressable onPress={() => setVisible(false)}>
            <Text style={[styles.closeBtn, { color: theme.colors.primary }]}>关闭</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>照片统计</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {/* 概览卡片 */}
          <View style={styles.cardRow}>
            <StatCard
              theme={theme}
              label="总照片"
              value={stats.total.toString()}
              color={theme.colors.primary}
            />
            <StatCard
              theme={theme}
              label="总大小"
              value={formatFileSize(stats.totalSize)}
              color={theme.colors.tertiary}
            />
          </View>
          <View style={styles.cardRow}>
            <StatCard
              theme={theme}
              label="已收藏"
              value={stats.favCount.toString()}
              color={theme.colors.error}
            />
            <StatCard
              theme={theme}
              label="已AI分析"
              value={`${stats.aiProcessedCount}/${stats.total}`}
              color={theme.colors.tertiary}
            />
          </View>

          {/* 分类分布 */}
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>分类分布</Text>
          {Array.from(stats.categoryStats.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => (
              <View key={cat} style={styles.catRow}>
                <LineIcon name={CATEGORY_ICON[cat] || 'camera'} size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.catLabel, { color: theme.colors.onSurface }]}>
                  {CATEGORY_LABELS[cat] || cat}
                </Text>
                <View style={[styles.catBar, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.catBarFill,
                      {
                        backgroundColor: theme.colors.primary,
                        width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.catCount, { color: theme.colors.onSurfaceVariant }]}>{count}</Text>
              </View>
            ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function StatCard({
  theme,
  label,
  value,
  color,
}: {
  theme: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[statStyles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={[statStyles.label, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  value: { fontSize: 28, fontWeight: '700' },
  label: { fontSize: 13, marginTop: 4 },
});

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
  body: { padding: 16, paddingBottom: 80 },
  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 12 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  catLabel: { fontSize: 14, width: 50, marginLeft: 8 },
  catBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', marginHorizontal: 8 },
  catBarFill: { height: '100%', borderRadius: 3 },
  catCount: { fontSize: 13, fontWeight: '600', width: 32, textAlign: 'right' },
});
