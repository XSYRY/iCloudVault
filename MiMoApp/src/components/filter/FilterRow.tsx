import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { FilterChip } from './FilterChip';
import { usePhotoStore } from '../../store';
import { CATEGORY_LABELS } from '../../types';
import type { Category } from '../../types';

export function FilterRow() {
  const filter = usePhotoStore((s) => s.filter);
  const setFilter = usePhotoStore((s) => s.setFilter);

  const chips: { key: string; label: string; selected: boolean; onToggle: () => void }[] = [
    {
      key: 'fav',
      label: '收藏',
      selected: filter.isFavorite === true,
      onToggle: () => setFilter({ isFavorite: filter.isFavorite ? null : true }),
    },
    ...(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([cat, label]) => ({
      key: cat,
      label,
      selected: filter.category === cat,
      onToggle: () => setFilter({ category: filter.category === cat ? null : cat }),
    })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.content}
    >
      {chips.map(({ key, ...chip }) => (
        <FilterChip key={key} {...chip} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 36 },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8, gap: 8, alignItems: 'center' },
});
