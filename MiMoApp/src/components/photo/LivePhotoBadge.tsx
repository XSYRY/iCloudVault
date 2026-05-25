import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineIcon } from '../shared/LineIcon';
import { useAppTheme } from '../../theme';

interface LivePhotoBadgeProps {
  isPlaying?: boolean;
  compact?: boolean;
}

export const LivePhotoBadge = memo(function LivePhotoBadge({ isPlaying, compact }: LivePhotoBadgeProps) {
  const { md3Theme: theme } = useAppTheme();
  const iconSize = compact ? 8 : 10;
  const fontSize = compact ? 8 : 10;

  return (
    <View style={[
      styles.container,
      isPlaying && styles.containerActive,
      compact && styles.containerCompact,
    ]}>
      <LineIcon name="live-photo" size={iconSize} color={isPlaying ? theme.colors.onSurface : theme.colors.surfaceContainerLowest} />
      <Text style={[
        styles.label,
        { fontSize, color: isPlaying ? theme.colors.onSurface : theme.colors.surfaceContainerLowest },
      ]}>
        {isPlaying ? '实况' : 'LIVE'}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 3,
  },
  containerCompact: {
    top: 4,
    left: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
  },
  containerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
