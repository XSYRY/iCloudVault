import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  FlatList,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMd3Theme } from '../theme';
import { usePhotoStore, useUiStore } from '../store';
import { getCollageLayout } from '../utils/collages';
import type { CollageLayout } from '../utils/collages';
import type { Photo } from '../types';
import type { RootStackScreenProps } from '../navigation/types';

// ============================================================
// CollageScreen — 拼图制作
// 选择 2-9 张照片，自动计算最佳布局
// ============================================================

export function CollageScreen({ route, navigation }: RootStackScreenProps<'Collage'>) {
  const insets = useSafeAreaInsets();
  const { photoIds } = route.params;
  const theme = useMd3Theme();
  const { width: screenWidth } = useWindowDimensions();
  const photos = usePhotoStore((s) => s.photos);
  const showToast = useUiStore((s) => s.showToast);

  const [selectedCount, setSelectedCount] = useState(Math.min(photoIds.length, 4));
  const [gap, setGap] = useState(4);
  const [radius, setRadius] = useState(8);

  const selectedPhotos = photoIds
    .slice(0, selectedCount)
    .map((id) => photos.find((p) => p.id === id))
    .filter(Boolean) as Photo[];

  const layout = useMemo(
    () => getCollageLayout(selectedCount),
    [selectedCount],
  );

  const canvasSize = screenWidth - 32;

  // 可选的布局模板
  const LAYOUT_PRESETS = [
    { count: 2, label: '2 张' },
    { count: 3, label: '3 张' },
    { count: 4, label: '4 张' },
    { count: 6, label: '6 张' },
    { count: 9, label: '9 张' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 顶部 */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: theme.colors.outlineVariant }]}>
        <Pressable onPress={navigation.goBack}>
          <Text style={[styles.headerBtn, { color: theme.colors.primary }]}>关闭</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>拼图制作</Text>
        <Pressable
          onPress={() => {
            showToast('拼图已保存', 'success');
            navigation.goBack();
          }}
        >
          <Text style={[styles.headerBtn, { color: theme.colors.primary, fontWeight: '600' }]}>
            保存
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* 画布预览 */}
        <View
          style={[
            styles.canvas,
            {
              width: canvasSize,
              height: canvasSize,
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: radius,
              gap,
            },
          ]}
        >
          {layout.cells.map((cell, idx) => {
            const photo = selectedPhotos[idx];
            const cellW = cell.w * canvasSize - gap * (layout.cols - 1) / layout.cols;
            const cellH = cell.h * canvasSize - gap * (layout.rows - 1) / layout.rows;
            return (
              <View
                key={idx}
                style={[
                  styles.cell,
                  {
                    position: 'absolute',
                    left: cell.x * canvasSize + (cell.x > 0 ? gap : 0),
                    top: cell.y * canvasSize + (cell.y > 0 ? gap : 0),
                    width: cellW,
                    height: cellH,
                    backgroundColor: photo?.color || theme.colors.primaryContainer,
                    borderRadius: radius / 2,
                    overflow: 'hidden',
                  },
                ]}
              >
                {photo?.thumbnailUri ? (
                  <Image
                    source={{ uri: photo.thumbnailUri }}
                    style={styles.cellImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.cellPlaceholder}>📷</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* 照片数量选择 */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>照片数量</Text>
        <View style={styles.chipRow}>
          {LAYOUT_PRESETS.map((preset) => (
            <Pressable
              key={preset.count}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    selectedCount === preset.count
                      ? theme.colors.primaryContainer
                      : theme.colors.surfaceVariant,
                },
              ]}
              onPress={() => setSelectedCount(Math.min(preset.count, photoIds.length))}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color:
                      selectedCount === preset.count
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {preset.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 间距调整 */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>边框宽度</Text>
        <View style={styles.chipRow}>
          {[0, 2, 4, 8, 12].map((g) => (
            <Pressable
              key={g}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    gap === g ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                },
              ]}
              onPress={() => setGap(g)}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color:
                      gap === g
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {g}px
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 圆角调整 */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>圆角</Text>
        <View style={styles.chipRow}>
          {[0, 4, 8, 12, 16].map((r) => (
            <Pressable
              key={r}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    radius === r ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                },
              ]}
              onPress={() => setRadius(r)}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color:
                      radius === r
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {r}px
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
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
  headerBtn: { fontSize: 15 },
  title: { fontSize: 17, fontWeight: '700' },
  body: { flex: 1, padding: 16 },
  canvas: {
    alignSelf: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  cell: { justifyContent: 'center', alignItems: 'center' },
  cellImage: { width: '100%', height: '100%' },
  cellPlaceholder: { fontSize: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10, marginTop: 8 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  chipText: { fontSize: 13, fontWeight: '600' },
});
