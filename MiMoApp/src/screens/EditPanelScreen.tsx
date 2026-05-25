import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMd3Theme } from '../theme';
import { LineIcon } from '../components/shared/LineIcon';
import { usePhotoStore, useUiStore } from '../store';
import type { RootStackScreenProps } from '../navigation/types';
import type { EditState } from '../types';
import { Toolbar } from '../components/shared/Toolbar';
import { AdjustTab } from '../components/lightbox/EditPanel/AdjustTab';
import { FilterTab } from '../components/lightbox/EditPanel/FilterTab';
import { CropTab } from '../components/lightbox/EditPanel/CropTab';
import { DrawTab } from '../components/lightbox/EditPanel/DrawTab';

type EditTab = 'adjust' | 'filter' | 'crop' | 'draw';

const TABS: { key: EditTab; label: string; icon: string }[] = [
  { key: 'adjust', label: '调整', icon: 'sliders' },
  { key: 'filter', label: '滤镜', icon: 'palette' },
  { key: 'crop', label: '裁剪', icon: 'crop' },
  { key: 'draw', label: '标注', icon: 'draw' },
];

export function EditPanelScreen({ route, navigation }: RootStackScreenProps<'EditPanel'>) {
  const insets = useSafeAreaInsets();
  const { photoId } = route.params;
  const theme = useMd3Theme();
  const { width: screenWidth } = useWindowDimensions();
  const photo = usePhotoStore((s) => s.photos.find((p) => p.id === photoId));
  const updatePhoto = usePhotoStore((s) => s.updatePhoto);
  const showToast = useUiStore((s) => s.showToast);

  const [activeTab, setActiveTab] = useState<EditTab>('adjust');
  const [edits, setEdits] = useState<EditState>(
    photo?.edits || {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      rotation: 0,
      crop: null,
      filter: null,
    },
  );
  const [hasAnnotation, setHasAnnotation] = useState(false);

  const handleAdjustChange = useCallback(
    (patch: Partial<EditState>) => setEdits((prev) => ({ ...prev, ...patch })),
    [],
  );

  const handleFilterSelect = useCallback(
    (filter: string | null) => setEdits((prev) => ({ ...prev, filter })),
    [],
  );

  const handleCrop = useCallback(
    (crop: any | null) => handleAdjustChange({ crop }),
    [handleAdjustChange],
  );

  const handleRotate = useCallback(() => {
    setEdits((prev) => ({
      ...prev,
      rotation: ((prev.rotation + 90) % 360) as EditState['rotation'],
    }));
  }, []);

  const handleSave = useCallback(() => {
    if (!photo) return;
    const version = {
      id: `ver-${Date.now()}`,
      timestamp: Date.now(),
      thumbnailUri: photo.thumbnailUri || photo.uri,
      description: `${TABS.find((t) => t.key === activeTab)?.label} 编辑`,
    };
    updatePhoto(photo.id, {
      edits,
      versions: [...(photo.versions || []), version],
    });
    showToast('已保存', 'success');
    navigation.goBack();
  }, [photo, edits, activeTab, updatePhoto, showToast, navigation]);

  const handleReset = useCallback(() => {
    setEdits({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      rotation: 0,
      crop: null,
      filter: null,
    });
    setHasAnnotation(false);
  }, []);

  if (!photo) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Toolbar title="编辑" showBack onBack={() => navigation.goBack()} />
        <View style={styles.emptyWrap}>
          <Text style={{ fontSize: 16, color: theme.colors.onSurfaceVariant }}>照片不存在</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 顶部栏 */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={[styles.headerBtn, { color: theme.colors.primary }]}>取消</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>编辑</Text>
        <Pressable onPress={handleSave}>
          <Text style={[styles.headerBtn, { color: theme.colors.primary, fontWeight: '600' }]}>
            保存
          </Text>
        </Pressable>
      </View>

      {/* 预览区 */}
      <View style={[styles.preview, { backgroundColor: theme.colors.backdrop }]}>
        <Image
          source={{ uri: photo.thumbnailUri || photo.uri }}
          style={[
            styles.previewImage,
            {
              transform: [{ rotate: `${edits.rotation}deg` }],
              opacity: 1 - Math.abs(edits.brightness) * 0.003,
            },
          ]}
          resizeMode="contain"
        />
      </View>

      {/* 标签栏 */}
      <View style={[styles.tabRow, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              {
                borderBottomColor:
                  activeTab === tab.key ? theme.colors.primary : 'transparent',
              },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <LineIcon name={tab.icon} size={16} color={activeTab === tab.key ? theme.colors.primary : theme.colors.onSurfaceVariant} />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    activeTab === tab.key
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 编辑控件区 */}
      <ScrollView
        style={[styles.editArea, { backgroundColor: theme.colors.surface }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'adjust' && (
          <AdjustTab edits={edits} onChange={handleAdjustChange} />
        )}
        {activeTab === 'filter' && (
          <FilterTab currentFilter={edits.filter} onSelect={handleFilterSelect} />
        )}
        {activeTab === 'crop' && (
          <CropTab
            crop={edits.crop}
            onCrop={handleCrop}
            onRotate={handleRotate}
            rotation={edits.rotation}
          />
        )}
        {activeTab === 'draw' && (
          <DrawTab
            onSaveAnnotation={() => {
              setHasAnnotation(true);
              showToast('标注已应用', 'success');
            }}
            onClear={() => {
              setHasAnnotation(false);
              showToast('标注已清除', 'info');
            }}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,

    paddingBottom: 12,
  },
  headerBtn: { fontSize: 15 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  preview: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: { width: '100%', height: '100%' },
  tabRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2.5,
  },
  tabLabel: { fontSize: 11, fontWeight: '600' },
  editArea: { flex: 1 },
});
