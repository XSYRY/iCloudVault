import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useMd3Theme } from '../../theme';
import { useSettingsStore, usePhotoStore } from '../../store';
import { LineIcon } from '../shared/LineIcon';

interface SearchSuggestionsProps {
  onSelect: (query: string) => void;
}

const SUGGESTIONS = [
  { text: '海边的日落', icon: 'image' },
  { text: '去年的旅行', icon: 'map-pin' },
  { text: '猫和狗', icon: 'heart' },
  { text: '春天的花', icon: 'leaf' },
  { text: '生日聚会', icon: 'user' },
  { text: '夜景', icon: 'photo' },
  { text: '美食', icon: 'palette' },
  { text: '自拍', icon: 'camera' },
];

export function SearchSuggestions({ onSelect }: SearchSuggestionsProps) {
  const theme = useMd3Theme();
  const searchHistory = useSettingsStore((s) => s.searchHistory);
  const setFilter = usePhotoStore((s) => s.setFilter);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {searchHistory.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              最近搜索
            </Text>
          </View>
          {searchHistory.slice(0, 5).map((query) => (
            <Pressable
              key={query}
              style={[styles.item, { borderBottomColor: theme.colors.outlineVariant }]}
              onPress={() => {
                setFilter({ searchQuery: query });
                onSelect(query);
              }}
            >
              <View style={styles.itemIconWrap}>
                <LineIcon name="clock" size={16} color={theme.colors.onSurfaceVariant} />
              </View>
              <Text style={[styles.itemText, { color: theme.colors.onSurface }]}>{query}</Text>
              <LineIcon name="chevron-right" size={14} color={theme.colors.outline} />
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
            试试搜索
          </Text>
        </View>
        <View style={styles.chipRow}>
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s.text}
              style={[styles.chip, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => {
                setFilter({ searchQuery: s.text });
                onSelect(s.text);
              }}
            >
              <LineIcon name={s.icon} size={14} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.chipText, { color: theme.colors.onSurface }]}>{s.text}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 8 },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemText: { fontSize: 15, flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  chipText: { fontSize: 13, fontWeight: '500' },
});
