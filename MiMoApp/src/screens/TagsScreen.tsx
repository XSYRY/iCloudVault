import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useMd3Theme } from '../theme';
import { usePhotoStore } from '../store';
import { getTagService } from '../services/tags';
import type { TagInfo } from '../services/tags';
import { Toolbar } from '../components/shared/Toolbar';
import { ContextMenu, type ContextMenuItem } from '../components/shared/ContextMenu';
import { EmptyState } from '../components/shared/EmptyState';
import type { RootStackScreenProps } from '../navigation/types';

function tagFontSize(count: number, maxCount: number): number {
  if (maxCount === 0) return 14;
  const ratio = count / maxCount;
  return Math.round(12 + ratio * 10);
}

export function TagsScreen({ navigation }: RootStackScreenProps<'Tags'>) {
  const theme = useMd3Theme();
  const photos = usePhotoStore((s) => s.photos);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextTag, setContextTag] = useState<TagInfo | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [merging, setMerging] = useState(false);
  const [mergeTarget, setMergeTarget] = useState('');

  const allTags = useMemo((): TagInfo[] => {
    return getTagService().getAllTags();
  }, [photos]);

  const filteredTags = useMemo((): TagInfo[] => {
    if (!searchQuery.trim()) return allTags;
    return getTagService().getTagSuggestions(searchQuery.trim());
  }, [allTags, searchQuery]);

  const maxCount = useMemo(() => {
    return Math.max(0, ...allTags.map((t) => t.count));
  }, [allTags]);

  const contextMenuItems = useMemo((): ContextMenuItem[] => {
    if (!contextTag) return [];
    return [
      { id: 'rename', label: '重命名' },
      { id: 'merge', label: '合并到…' },
      { id: 'delete', label: '删除标签', destructive: true },
    ];
  }, [contextTag]);

  const handleContextSelect = useCallback(
    (id: string) => {
      if (!contextTag) return;
      switch (id) {
        case 'rename':
          setRenameText(contextTag.name);
          setRenaming(true);
          break;
        case 'merge':
          setMergeTarget('');
          setMerging(true);
          break;
        case 'delete':
          Alert.alert('删除标签', `确定要从所有照片中移除「${contextTag.name}」吗？`, [
            { text: '取消', style: 'cancel' },
            {
              text: '删除',
              style: 'destructive',
              onPress: () => getTagService().deleteTag(contextTag.name),
            },
          ]);
          break;
      }
    },
    [contextTag],
  );

  const handleRename = useCallback(() => {
    if (!contextTag || !renameText.trim() || renameText.trim() === contextTag.name) {
      setRenaming(false);
      return;
    }
    getTagService().renameTag(contextTag.name, renameText.trim());
    setRenaming(false);
    setRenameText('');
  }, [contextTag, renameText]);

  const handleMerge = useCallback(() => {
    if (!contextTag || !mergeTarget.trim() || mergeTarget.trim() === contextTag.name) {
      setMerging(false);
      return;
    }
    Alert.alert(
      '合并标签',
      `将「${contextTag.name}」合并到「${mergeTarget.trim()}」？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '合并',
          onPress: () => {
            getTagService().mergeTags(contextTag.name, mergeTarget.trim());
            setMerging(false);
            setMergeTarget('');
          },
        },
      ],
    );
  }, [contextTag, mergeTarget]);

  if (allTags.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Toolbar title="标签" showBack onBack={() => navigation.goBack()} />
        <EmptyState
          icon="tag"
          title="还没有标签"
          subtitle="AI 分析照片后会自动生成标签"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Toolbar
        title={`标签 (${allTags.length})`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <View
        style={[styles.searchWrap, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <TextInput
          style={[styles.searchInput, { color: theme.colors.onSurface }]}
          placeholder="搜索标签…"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlashList
        data={filteredTags}
        keyExtractor={(item) => item.name}
        estimatedItemSize={50}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.cloudContent}
        renderItem={({ item }) => {
          const fontSize = tagFontSize(item.count, maxCount);
          return (
            <Pressable
              style={[
                styles.chip,
                {
                  backgroundColor: theme.colors.secondaryContainer,
                  borderRadius: 999,
                },
              ]}
              onPress={() => navigation.navigate('SearchResults', { query: item.name })}
              onLongPress={() => setContextTag(item)}
            >
              <Text
                style={[
                  styles.chipName,
                  { color: theme.colors.onSecondaryContainer, fontSize },
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text
                style={[styles.chipCount, { color: theme.colors.onSecondaryContainer }]}
              >
                {item.count}
              </Text>
            </Pressable>
          );
        }}
      />

      <ContextMenu
        visible={contextTag !== null && !renaming && !merging}
        title={contextTag?.name}
        items={contextMenuItems}
        onSelect={handleContextSelect}
        onClose={() => setContextTag(null)}
      />

      <Modal visible={renaming} transparent animationType="fade" onRequestClose={() => setRenaming(false)}>
        <Pressable style={styles.backdrop} onPress={() => setRenaming(false)}>
          <Pressable style={[styles.dialog, { backgroundColor: theme.colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.dialogTitle, { color: theme.colors.onSurface }]}>
              重命名标签
            </Text>
            <TextInput
              style={[
                styles.dialogInput,
                { color: theme.colors.onSurface, borderColor: theme.colors.outline },
              ]}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              placeholder="新标签名"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              onSubmitEditing={handleRename}
            />
            <View style={styles.dialogActions}>
              <Pressable onPress={() => setRenaming(false)} style={styles.dialogBtn}>
                <Text style={[styles.dialogBtnText, { color: theme.colors.onSurfaceVariant }]}>
                  取消
                </Text>
              </Pressable>
              <Pressable onPress={handleRename} style={styles.dialogBtn}>
                <Text style={[styles.dialogBtnText, { color: theme.colors.primary }]}>
                  确定
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={merging} transparent animationType="fade" onRequestClose={() => setMerging(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMerging(false)}>
          <Pressable style={[styles.dialog, { backgroundColor: theme.colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.dialogTitle, { color: theme.colors.onSurface }]}>
              合并标签
            </Text>
            <Text style={[styles.dialogLabel, { color: theme.colors.onSurfaceVariant }]}>
              将「{contextTag?.name}」合并到：
            </Text>
            <TextInput
              style={[
                styles.dialogInput,
                { color: theme.colors.onSurface, borderColor: theme.colors.outline },
              ]}
              value={mergeTarget}
              onChangeText={setMergeTarget}
              autoFocus
              placeholder="目标标签名"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              onSubmitEditing={handleMerge}
            />
            <View style={styles.dialogActions}>
              <Pressable onPress={() => setMerging(false)} style={styles.dialogBtn}>
                <Text style={[styles.dialogBtnText, { color: theme.colors.onSurfaceVariant }]}>
                  取消
                </Text>
              </Pressable>
              <Pressable onPress={handleMerge} style={styles.dialogBtn}>
                <Text style={[styles.dialogBtnText, { color: theme.colors.primary }]}>
                  合并
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  searchInput: {
    fontSize: 15,
    paddingVertical: 8,
  },
  cloudContent: {
    padding: 16,
    paddingBottom: 80,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  chipName: {
    fontWeight: '500',
  },
  chipCount: {
    fontSize: 11,
    marginLeft: 4,
    opacity: 0.7,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000055',
    padding: 32,
  },
  dialog: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 20,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dialogLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  dialogInput: {
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  dialogBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dialogBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
