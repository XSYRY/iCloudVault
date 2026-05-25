import React from 'react';
import { Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useMd3Theme } from '../../theme';
import { parseIntent } from '../../ai/nlu/parser';
import type { ParsedIntent } from '../../ai/nlu/parser';

// ============================================================
// SemanticChips — 将搜索文本解析为语义标签并显示
// 例如 "去年在海边拍的日落" → [去年] [海边] [日落]
// ============================================================

interface SemanticChipsProps {
  query: string;
  onRemoveChip: (field: keyof ParsedIntent) => void;
}

const FIELD_LABELS: Record<keyof ParsedIntent, string> = {
  time: '时间',
  location: '地点',
  keyword: '内容',
  category: '分类',
  season: '季节',
  raw: '',
};

export function SemanticChips({ query, onRemoveChip }: SemanticChipsProps) {
  const theme = useMd3Theme();
  const intent = parseIntent(query);

  const chips: Array<{ field: keyof ParsedIntent; value: string }> = [];
  if (intent.time) chips.push({ field: 'time', value: intent.time });
  if (intent.location) chips.push({ field: 'location', value: intent.location });
  if (intent.keyword) chips.push({ field: 'keyword', value: intent.keyword });
  if (intent.category) chips.push({ field: 'category', value: intent.category });
  if (intent.season) chips.push({ field: 'season', value: intent.season });

  if (chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.container}
    >
      {chips.map((chip) => (
        <Pressable
          key={chip.field}
          style={[styles.chip, { backgroundColor: theme.colors.secondaryContainer }]}
          onPress={() => onRemoveChip(chip.field)}
        >
          <Text style={[styles.field, { color: theme.colors.onSecondaryContainer }]}>
            {FIELD_LABELS[chip.field]}
          </Text>
          <Text style={[styles.value, { color: theme.colors.onSecondaryContainer }]}>
            {chip.value}
          </Text>
          <Text style={[styles.remove, { color: theme.colors.onSecondaryContainer }]}>×</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { maxHeight: 40, marginBottom: 4 },
  row: { paddingHorizontal: 12, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  field: { fontSize: 10, fontWeight: '700', opacity: 0.7 },
  value: { fontSize: 13, fontWeight: '500' },
  remove: { fontSize: 16, marginLeft: 2, fontWeight: '600' },
});
