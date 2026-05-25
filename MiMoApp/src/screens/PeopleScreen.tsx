import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useMd3Theme } from '../theme';
import { usePhotoStore } from '../store';
import { getFaceClusterService } from '../services/faceCluster';
import type { FaceGroup } from '../services/faceCluster';
import { Toolbar } from '../components/shared/Toolbar';
import { EmptyState } from '../components/shared/EmptyState';
import type { RootStackScreenProps } from '../navigation/types';

export function PeopleScreen({ navigation }: RootStackScreenProps<'People'>) {
  const theme = useMd3Theme();
  const { width: screenWidth } = useWindowDimensions();
  const photos = usePhotoStore((s) => s.photos);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const faceGroups = useMemo((): FaceGroup[] => {
    const service = getFaceClusterService();
    return service.cluster(photos);
  }, [photos]);

  const numColumns = 3;
  const gap = 8;
  const cardSize = (screenWidth - 32 - gap * (numColumns - 1)) / numColumns;

  const handleRename = (group: FaceGroup) => {
    const service = getFaceClusterService();
    service.renameGroup(group.id, renameText.trim());
    setRenamingId(null);
    setRenameText('');
  };

  if (faceGroups.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Toolbar title="人物" showBack onBack={() => navigation.goBack()} />
        <EmptyState
          icon="users"
          title="人物聚类"
          subtitle="AI 人脸识别后自动按人脸分组，需要拍摄包含人物的照片"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Toolbar
        title={`人物 (${faceGroups.length}组)`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <FlashList
        data={faceGroups}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        estimatedItemSize={140}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.card,
              {
                width: cardSize,
                marginBottom: gap,
                marginRight: gap,
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: 16,
                overflow: 'hidden',
              },
            ]}
            onPress={() => navigation.navigate('FaceGroupDetail', { groupId: item.id })}
            onLongPress={() => {
              setRenamingId(item.id);
              setRenameText(item.name);
            }}
          >
            <Image
              source={{ uri: item.coverUri }}
              style={[styles.thumb, { width: cardSize, height: cardSize }]}
              resizeMode="cover"
            />
            <View style={[styles.caption, { backgroundColor: theme.colors.surfaceVariant }]}>
              {renamingId === item.id ? (
                <TextInput
                  style={[styles.renameInput, { color: theme.colors.onSurface, borderColor: theme.colors.primary }]}
                  value={renameText}
                  onChangeText={setRenameText}
                  onSubmitEditing={() => handleRename(item)}
                  onBlur={() => setRenamingId(null)}
                  autoFocus
                  placeholder="输入名字"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                />
              ) : (
                <>
                  <Text style={[styles.name, { color: theme.colors.onSurface }]} numberOfLines={1}>
                    {item.name || '未命名'}
                  </Text>
                  <Text style={[styles.count, { color: theme.colors.onSurfaceVariant }]}>
                    {item.photoCount} 张
                  </Text>
                </>
              )}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { alignItems: 'center' },
  thumb: { backgroundColor: '#eee' },
  caption: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
  },
  name: { fontSize: 13, fontWeight: '600' },
  count: { fontSize: 11 },
  renameInput: {
    fontSize: 13,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: '100%',
    textAlign: 'center',
  },
});
