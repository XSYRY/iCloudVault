import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useMd3Theme } from '../../theme';
import { usePhotoStore, useUiStore } from '../../store';
import type { ExifData } from '../../types';
import { formatExifValue } from '../../utils/exif';

// ============================================================
// ExifEditor — 编辑照片 EXIF 元数据
// 支持修改日期、位置、设备等信息
// ============================================================

interface ExifEditorProps {
  visible: boolean;
  photoId: string;
  exif: ExifData;
  onClose: () => void;
}

interface EditableField {
  key: keyof ExifData;
  label: string;
  type: 'text' | 'number';
}

const EDITABLE_FIELDS: EditableField[] = [
  { key: 'dateTaken', label: '拍摄日期', type: 'text' },
  { key: 'make', label: '相机制造商', type: 'text' },
  { key: 'model', label: '相机型号', type: 'text' },
  { key: 'iso', label: 'ISO', type: 'number' },
  { key: 'fNumber', label: '光圈 (f/)', type: 'number' },
  { key: 'exposureTime', label: '曝光时间', type: 'text' },
  { key: 'focalLength', label: '焦距', type: 'text' },
];

export function ExifEditor({ visible, photoId, exif, onClose }: ExifEditorProps) {
  const theme = useMd3Theme();
  const updatePhoto = usePhotoStore((s) => s.updatePhoto);
  const showToast = useUiStore((s) => s.showToast);

  const [edits, setEdits] = useState<Partial<ExifData>>({});
  const hasEdits = Object.keys(edits).length > 0;

  const handleChange = (key: keyof ExifData, value: string) => {
    setEdits((prev) => {
      const next = { ...prev };
      if (value === '' || value === String(exif[key] ?? '')) {
        delete next[key];
      } else {
        const field = EDITABLE_FIELDS.find((f) => f.key === key);
        if (field?.type === 'number') {
          const num = parseFloat(value);
          if (!isNaN(num)) (next as any)[key] = num;
        } else {
          (next as any)[key] = value;
        }
      }
      return next;
    });
  };

  const sheetTranslateY = useSharedValue(300);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      sheetTranslateY.value = withSpring(0, { damping: 20, stiffness: 200, mass: 0.8 });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      sheetTranslateY.value = 300;
      backdropOpacity.value = 0;
    }
  }, [visible]);

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleSave = () => {
    if (!hasEdits) return;
    updatePhoto(photoId, { exif: { ...exif, ...edits } });
    showToast('EXIF 已更新', 'success');
    setEdits({});
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, backdropAnimStyle]}>
        <Animated.View style={[styles.sheet, { backgroundColor: theme.colors.surface }, sheetAnimStyle]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.outlineVariant }]} />

          <Text style={[styles.title, { color: theme.colors.onSurface }]}>编辑 EXIF</Text>

          <View style={styles.fields}>
            {EDITABLE_FIELDS.map((field) => {
              const currentValue = edits[field.key] !== undefined
                ? String(edits[field.key])
                : formatExifValue(exif, field.key);
              const isEdited = field.key in edits;

              return (
                <View key={field.key} style={styles.fieldRow}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>
                    {field.label}
                  </Text>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      {
                        backgroundColor: isEdited
                          ? theme.colors.primaryContainer
                          : theme.colors.surfaceVariant,
                        color: isEdited
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurface,
                        borderColor: isEdited ? theme.colors.primary : 'transparent',
                      },
                    ]}
                    value={currentValue}
                    onChangeText={(text) => handleChange(field.key, text)}
                    keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                </View>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => {
                setEdits({});
                onClose();
              }}
            >
              <Text style={[styles.btnText, { color: theme.colors.onSurface }]}>取消</Text>
            </Pressable>
            <Pressable
              style={[
                styles.btn,
                { backgroundColor: hasEdits ? theme.colors.primary : theme.colors.outlineVariant },
              ]}
              onPress={handleSave}
              disabled={!hasEdits}
            >
              <Text
                style={[
                  styles.btnText,
                  { color: hasEdits ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
                ]}
              >
                保存
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
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
  fields: { gap: 4 },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  fieldLabel: { width: 90, fontSize: 13, fontWeight: '500' },
  fieldInput: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnText: { fontSize: 15, fontWeight: '600' },
});
