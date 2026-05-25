import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useMd3Theme } from '../../theme';
import { formatMonth } from '../../utils/date';

interface DateGroupHeaderProps {
  month: string;
  count: number;
}

export const DateGroupHeader = memo(function DateGroupHeader({ month, count }: DateGroupHeaderProps) {
  const theme = useMd3Theme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.month, { color: theme.colors.onSurface }]}>{formatMonth(month)}</Text>
      <Text style={[styles.count, { color: theme.colors.onSurfaceVariant }]}>{count} 张</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  month: { fontSize: 16, fontWeight: '700' },
  count: { fontSize: 13 },
});

