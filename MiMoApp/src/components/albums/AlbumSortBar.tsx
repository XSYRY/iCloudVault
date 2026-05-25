import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useMd3Theme } from '../../theme';
import { LineIcon } from '../shared/LineIcon';

// ============================================================
// AlbumSortBar — 相册排序/过滤工具栏
// 按名称、数量、类型排序
// ============================================================

export type AlbumSortKey = 'name' | 'count' | 'recent' | 'type';

interface AlbumSortBarProps {
  activeSort: AlbumSortKey;
  onSortChange: (key: AlbumSortKey) => void;
}

const SORT_OPTIONS: { key: AlbumSortKey; label: string; icon: string }[] = [
  { key: 'recent', label: '最近', icon: 'clock' },
  { key: 'name', label: '名称', icon: 'type' },
  { key: 'count', label: '数量', icon: 'hash' },
  { key: 'type', label: '类型', icon: 'folder' },
];

export function AlbumSortBar({ activeSort, onSortChange }: AlbumSortBarProps) {
  const theme = useMd3Theme();

  return (
    <View style={[styles.container, { borderBottomColor: theme.colors.outlineVariant }]}>
      <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>排序:</Text>
      {SORT_OPTIONS.map((opt) => (
        <Pressable
          key={opt.key}
          style={[
            styles.chip,
            {
              backgroundColor:
                activeSort === opt.key
                  ? theme.colors.secondaryContainer
                  : 'transparent',
              borderColor:
                activeSort === opt.key
                  ? theme.colors.secondaryContainer
                  : theme.colors.outlineVariant,
            },
          ]}
          onPress={() => onSortChange(opt.key)}
        >
          <LineIcon name={opt.icon} size={12} color={activeSort === opt.key ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant} />
          <Text
            style={[
              styles.chipText,
              {
                color:
                  activeSort === opt.key
                    ? theme.colors.onSecondaryContainer
                    : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 0.5,
  },
  label: { fontSize: 12, fontWeight: '600', marginRight: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
  },
  chipText: { fontSize: 12, fontWeight: '500' },
});
