import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMd3Theme } from '../theme';
import { usePhotoStore } from '../store';
import { formatFileSize } from '../utils/image';
import { CATEGORY_LABELS, CATEGORY_ICON } from '../utils/constants';
import { Toolbar } from '../components/shared/Toolbar';
import { EmptyState } from '../components/shared/EmptyState';
import { LineIcon } from '../components/shared/LineIcon';
import type { Category } from '../types';
import type { RootStackScreenProps } from '../navigation/types';

// ============================================================
// StorageDashboard — 存储空间管理
// 分类统计 + 大文件列表 + 清理建议
// ============================================================

export function StorageDashboardScreen({ navigation }: RootStackScreenProps<'StorageDashboard'>) {
  const insets = useSafeAreaInsets();
  const theme = useMd3Theme();
  const photos = usePhotoStore((s) => s.photos);

  const stats = useMemo(() => {
    const active = photos.filter((p) => !p.isDeleted);
    const deleted = photos.filter((p) => p.isDeleted);
    const activeSize = active.reduce((s, p) => s + p.sizeBytes, 0);
    const deletedSize = deleted.reduce((s, p) => s + p.sizeBytes, 0);
    const totalSize = activeSize + deletedSize;

    // 按分类统计大小
    const categorySize = new Map<Category, number>();
    for (const p of active) {
      const cat = p.aiCategory || 'other';
      categorySize.set(cat, (categorySize.get(cat) || 0) + p.sizeBytes);
    }

    // 大文件 TOP 10
    const largest = [...active]
      .sort((a, b) => b.sizeBytes - a.sizeBytes)
      .slice(0, 10);

    // 重复照片（有 duplicateOfId 标记的）
    const duplicates = active.filter((p) => p.duplicateOfId !== null);

    return {
      activeCount: active.length,
      deletedCount: deleted.length,
      totalCount: photos.length,
      activeSize,
      deletedSize,
      totalSize,
      categorySize,
      largest,
      duplicateCount: duplicates.length,
      wasteSize: deletedSize + duplicates.reduce((s, p) => s + p.sizeBytes, 0),
    };
  }, [photos]);

  // 假设总空间 10 GB（后期从系统 API 获取）
  const totalSpace = 10 * 1024 * 1024 * 1024;
  const usedPct = (stats.totalSize / totalSpace) * 100;

  if (stats.totalCount === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={navigation.goBack}>
            <Text style={[styles.closeBtn, { color: theme.colors.primary }]}>关闭</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>存储管理</Text>
          <View style={{ width: 48 }} />
        </View>
        <EmptyState icon="storage" title="暂无数据" subtitle="导入照片后查看存储统计" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: theme.colors.outlineVariant }]}>
        <Pressable onPress={navigation.goBack}>
          <Text style={[styles.closeBtn, { color: theme.colors.primary }]}>关闭</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>存储管理</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* 总体概览 */}
        <View style={[styles.overviewCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={[styles.overviewTitle, { color: theme.colors.onSurface }]}>
            已使用 {formatFileSize(stats.totalSize)}
          </Text>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.outlineVariant }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: theme.colors.primary, width: `${Math.min(usedPct, 100)}%` },
              ]}
            />
          </View>
          <Text style={[styles.overviewSub, { color: theme.colors.onSurfaceVariant }]}>
            共 {stats.totalCount} 张照片 · 可用 {formatFileSize(totalSpace - stats.totalSize)}
          </Text>
        </View>

        {/* 详细统计 */}
        <View style={styles.cardsRow}>
          <StatMiniCard
            theme={theme}
            label="活跃照片"
            value={stats.activeCount.toString()}
            sub={formatFileSize(stats.activeSize)}
            color={theme.colors.primary}
          />
          <StatMiniCard
            theme={theme}
            label="回收站"
            value={stats.deletedCount.toString()}
            sub={formatFileSize(stats.deletedSize)}
            color={theme.colors.error}
          />
          <StatMiniCard
            theme={theme}
            label="重复照片"
            value={stats.duplicateCount.toString()}
            sub={stats.duplicateCount > 0 ? '建议清理' : '无'}
            color={theme.colors.tertiary}
          />
        </View>

        {/* 分类占用 */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>分类占用</Text>
        {Array.from(stats.categorySize.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([cat, size]) => (
            <View key={cat} style={styles.catRow}>
              <LineIcon name={CATEGORY_ICON[cat] || 'camera'} size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.catLabel, { color: theme.colors.onSurface }]}>
                {CATEGORY_LABELS[cat]}
              </Text>
              <View style={[styles.catBar, { backgroundColor: theme.colors.surfaceVariant }]}>
                <View
                  style={[
                    styles.catFill,
                    {
                      backgroundColor: theme.colors.primary,
                      width: `${(size / stats.activeSize) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.catSize, { color: theme.colors.onSurfaceVariant }]}>
                {formatFileSize(size)}
              </Text>
            </View>
          ))}

        {/* 清理建议 */}
        {stats.wasteSize > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>清理建议</Text>
            <View style={[styles.cleanCard, { backgroundColor: theme.colors.errorContainer }]}>
              <Text style={[styles.cleanText, { color: theme.colors.onErrorContainer }]}>
                可释放 {formatFileSize(stats.wasteSize)} 空间
              </Text>
              <Text style={[styles.cleanDetail, { color: theme.colors.onErrorContainer }]}>
                包括 {stats.deletedCount} 张回收站照片
                {stats.duplicateCount > 0 && ` 和 ${stats.duplicateCount} 张重复照片`}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatMiniCard({
  theme,
  label,
  value,
  sub,
  color,
}: {
  theme: any;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <View style={[miniStyles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Text style={[miniStyles.value, { color }]}>{value}</Text>
      <Text style={[miniStyles.label, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
      <Text style={[miniStyles.sub, { color: theme.colors.onSurfaceVariant }]}>{sub}</Text>
    </View>
  );
}

const miniStyles = StyleSheet.create({
  card: { flex: 1, padding: 12, borderRadius: 14, alignItems: 'center' },
  value: { fontSize: 22, fontWeight: '700' },
  label: { fontSize: 11, marginTop: 2 },
  sub: { fontSize: 10, marginTop: 2, opacity: 0.7 },
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
  body: { flex: 1, padding: 16 },
  overviewCard: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
  },
  overviewTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  overviewSub: { fontSize: 12, marginTop: 8 },
  cardsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10, marginTop: 4 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  catLabel: { fontSize: 13, width: 50, marginLeft: 6 },
  catBar: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden', marginHorizontal: 8 },
  catFill: { height: '100%', borderRadius: 3 },
  catSize: { fontSize: 12, fontWeight: '500', width: 52, textAlign: 'right' },
  cleanCard: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 80,
  },
  cleanText: { fontSize: 15, fontWeight: '600' },
  cleanDetail: { fontSize: 12, marginTop: 4, opacity: 0.8 },
});
