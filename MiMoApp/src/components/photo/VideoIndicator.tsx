import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme';
import { LineIcon } from '../shared/LineIcon';

interface VideoIndicatorProps {
  duration: number | null;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export const VideoIndicator = memo(function VideoIndicator({ duration }: VideoIndicatorProps) {
  const { md3Theme: theme } = useAppTheme();

  return (
    <View style={styles.container}>
      <LineIcon name="play" size={10} color={theme.colors.surfaceContainerLowest} />
      {duration != null && (
        <Text style={[styles.time, { color: theme.colors.surfaceContainerLowest }]}>{formatDuration(duration)}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 4,
  },
  time: {
    fontSize: 11,
    fontWeight: '600',
  },
});
