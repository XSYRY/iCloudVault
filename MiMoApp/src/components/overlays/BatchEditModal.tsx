import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { useMd3Theme } from '../../theme';
import { usePhotoStore, useUiStore } from '../../store';
import { CATEGORY_LABELS, CATEGORY_ICON } from '../../utils/constants';
import type { Category } from '../../types';
import { LineIcon } from '../shared/LineIcon';

interface BatchEditModalProps {
  visible: boolean;
  photoIds: string[];
  onClose: () => void;
}

const PRESET_TAGS = ['风景', '旅行', '美食', '人物', '宠物', '自拍', '夜景', '花', '街拍', '建筑'];

export function BatchEditModal({ visible, photoIds, onClose }: BatchEditModalProps) {
  const theme = useMd3Theme();
  const updatePhoto = usePhotoStore((s) => s.updatePhoto);
  const showToast = useUiStore((s) => s.showToast);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [customTag, setCustomTag] = useState('');

  const hasSelection = selectedCategory !== null || selectedTags.size > 0;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (!tag || selectedTags.has(tag)) return;
    setSelectedTags((prev) => new Set(prev).add(tag));
    setCustomTag('');
  };

  const handleApply = () => {
    const tags = Array.from(selectedTags);
    const patch: Record<string, any> = {};
    if (selectedCategory) patch.aiCategory = selectedCategory;
    if (tags.length > 0) patch.aiTags = tags;

    for (const id of photoIds) {
      updatePhoto(id, patch);
    }
    showToast(`已更新 ${photoIds.length} 张照片`, 'success');
    setSelectedCategory(null);
    setSelectedTags(new Set());
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.outlineVariant }]} />
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            批量编辑 {photoIds.length} 张照片
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>分类</Text>
            <View style={styles.chipRow}>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        selectedCategory === cat
                          ? theme.colors.primaryContainer
                          : theme.colors.surfaceVariant,
                    },
                  ]}
                  onPress={() =>
                    setSelectedCategory(selectedCategory === cat ? null : cat)
                  }
                >
                  <LineIcon name={CATEGORY_ICON[cat] || 'camera'} size={14} color={theme.colors.onSurfaceVariant} />
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          selectedCategory === cat
                            ? theme.colors.onPrimaryContainer
                            : theme.colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>标签</Text>
            <View style={styles.tagInputRow}>
              <TextInput
                style={[
                  styles.tagInput,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    color: theme.colors.onSurface,
                  },
                ]}
                placeholder="添加自定义标签..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={customTag}
                onChangeText={setCustomTag}
                onSubmitEditing={addCustomTag}
                returnKeyType="done"
              />
              <Pressable
                style={[styles.addBtn, { backgroundColor: theme.colors.primaryContainer }]}
                onPress={addCustomTag}
              >
                <Text style={[styles.addBtnText, { color: theme.colors.onPrimaryContainer }]}>+</Text>
              </Pressable>
            </View>
            <View style={styles.chipRow}>
              {PRESET_TAGS.map((tag) => {
                const active = selectedTags.has(tag);
                return (
                  <Pressable
                    key={tag}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active
                          ? theme.colors.secondaryContainer
                          : theme.colors.surfaceVariant,
                      },
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: active
                            ? theme.colors.onSecondaryContainer
                            : theme.colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
              {Array.from(selectedTags)
                .filter((t) => !PRESET_TAGS.includes(t))
                .map((tag) => (
                  <Pressable
                    key={tag}
                    style={[styles.chip, { backgroundColor: theme.colors.secondaryContainer }]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.chipText, { color: theme.colors.onSecondaryContainer }]}>
                      {tag} ×
                    </Text>
                  </Pressable>
                ))}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              style={[styles.cancelBtn, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: theme.colors.onSurface }]}>取消</Text>
            </Pressable>
            <Pressable
              style={[
                styles.applyBtn,
                {
                  backgroundColor: hasSelection
                    ? theme.colors.primary
                    : theme.colors.outlineVariant,
                },
              ]}
              onPress={handleApply}
              disabled={!hasSelection}
            >
              <Text
                style={[
                  styles.applyText,
                  {
                    color: hasSelection
                      ? theme.colors.onPrimary
                      : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                应用到 {photoIds.length} 张
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000066',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '75%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  body: { maxHeight: 380 },
  sectionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 4,
  },
  chipText: { fontSize: 13, fontWeight: '500' },
  tagInputRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tagInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { fontSize: 20, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600' },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyText: { fontSize: 15, fontWeight: '600' },
});
