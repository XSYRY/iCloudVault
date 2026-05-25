import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useMd3Theme } from '../../theme';
import { LineIcon } from '../shared/LineIcon';

interface ToolbarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export function Toolbar({ title, subtitle, showBack, onBack, actions }: ToolbarProps) {
  const theme = useMd3Theme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      accessible
      accessibilityLabel={title}
      accessibilityRole="header"
    >
      <View style={styles.left}>
        {showBack && (
          <Pressable
            onPress={onBack}
            style={[styles.backBtn, { borderRadius: 50 }]}
            accessible
            accessibilityLabel="返回"
            accessibilityHint="返回上一页"
            accessibilityRole="button"
          >
            <LineIcon name="chevron-left" size={24} color={theme.colors.onSurfaceVariant} />
          </Pressable>
        )}
        {!showBack && (
          <View style={styles.logoWrapper}>
            <LineIcon name="photo" size={26} color={theme.colors.primary} />
          </View>
        )}
      </View>
      <View style={styles.center}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.right}>{actions}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    borderBottomWidth: 0,
  },
  left: { width: 44, alignItems: 'flex-start' },
  center: { flex: 1, alignItems: 'flex-start' },
  right: { flexDirection: 'row', gap: 4 },
  backBtn: { 
    padding: 8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 12, marginTop: 1 },
  logoWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
