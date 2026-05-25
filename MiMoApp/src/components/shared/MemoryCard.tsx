import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useAppTheme } from '../../theme';
import { LineIcon } from './LineIcon';
import type { MemoryGroup } from '../../services/memories';

interface MemoryCardProps {
  memory: MemoryGroup;
  photoUri?: string;
  color?: string;
  onPress: (photoId: string) => void;
}

export function MemoryCard({ memory, photoUri, color, onPress }: MemoryCardProps) {
  const { md3Theme: theme, tokens } = useAppTheme();

  return (
    <Pressable
      style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}
      onPress={() => {
        const firstId = memory.photos[0]?.id;
        if (firstId) onPress(firstId);
      }}
    >
      <View style={[styles.imageWrap, { backgroundColor: color || theme.colors.primaryContainer }]}>
        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.image} resizeMode="cover" />
        )}
        <View style={[styles.overlay, { backgroundColor: tokens.scrim }]}>
          <LineIcon name={memory.type === 'on-this-day' ? 'calendar' : memory.type === 'seasonal' ? 'flower-2' : memory.type === 'location' ? 'map-pin' : 'user'} size={36} color={theme.colors.surfaceContainerLowest} />
        </View>
      </View>

      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>{memory.title}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {memory.subtitle}
        </Text>
        <Text style={[styles.date, { color: theme.colors.outline }]}>
          {memory.dateLabel} · {memory.photos.length} 张
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
  },
  imageWrap: { height: 160, width: '100%' },
  image: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { padding: 18 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  date: { fontSize: 12, marginTop: 4 },
});
