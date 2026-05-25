import React, { useMemo, useEffect, useRef } from 'react';
import { StyleSheet, Pressable, Text, Animated, View } from 'react-native';
import { useAppTheme, type AppMD3Theme, type AppTokens } from '../../theme';
import { usePhotoStore, useUiStore } from '../../store';
import { usePhotoImport } from '../../hooks/usePhotoImport';
import { ImportProgressModal } from '../overlays/ImportProgressModal';
import { LineIcon } from '../shared/LineIcon';
import type { TabScreenProps } from '../../navigation/types';

interface FabAction {
  id: string;
  iconName: string;
  label: string;
  onPress: () => void;
}

const FAB_SIZE = 56;
const FAB_RIGHT = 20;
const FAB_BOTTOM = 120;
const ITEM_SIZE = 44;
const ITEM_GAP = 10;

function FabMenuItem({ action, index, isOpen, theme, tokens }: {
  action: FabAction;
  index: number;
  isOpen: boolean;
  theme: AppMD3Theme;
  tokens: AppTokens;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.spring(anim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        delay: index * 30,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 120,
        delay: index * 15,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, index]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Animated.View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 5,
        marginBottom: ITEM_GAP,
        transform: [{ translateY }, { scale }],
        opacity,
      }}
    >
      <View style={[styles.labelPill, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.labelText, { color: theme.colors.onSurface }]}>{action.label}</Text>
      </View>
      <Pressable
        style={[styles.itemCircle, { backgroundColor: theme.colors.secondaryContainer }]}
        onPress={action.onPress}
        android_ripple={{ color: tokens.ripple, borderless: true }}
      >
        <LineIcon name={action.iconName} size={20} color={theme.colors.onSecondaryContainer} />
      </Pressable>
    </Animated.View>
  );
}

export function FabMenu({ navigation }: { navigation: TabScreenProps<'PhotosTab'>['navigation'] | TabScreenProps<'MapJourneysTab'>['navigation'] }) {
  const { md3Theme: theme, tokens } = useAppTheme();
  const isFabOpen = useUiStore((s) => s.isFabOpen);
  const toggleFab = useUiStore((s) => s.toggleFab);

  const { isImporting, progress, importFromGallery, importFromCamera, cancelImport } = usePhotoImport();

  const shapeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(shapeAnim, {
      toValue: isFabOpen ? 1 : 0,
      friction: 7,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [isFabOpen]);

  const borderRadius = 999;

  const rotate = shapeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const bgColor = isFabOpen ? theme.colors.error : theme.colors.primary;

  const actions: FabAction[] = useMemo(
    () => [
      {
        id: 'import-gallery',
        iconName: 'image',
        label: '从相册导入',
        onPress: () => { toggleFab(false); importFromGallery(); },
      },
      {
        id: 'import-camera',
        iconName: 'camera',
        label: '拍照导入',
        onPress: () => { toggleFab(false); importFromCamera(); },
      },
      {
        id: 'ai',
        iconName: 'robot',
        label: 'AI 分析',
        onPress: () => { toggleFab(false); useUiStore.getState().setAiOverlayVisible(true); },
      },
      {
        id: 'collage',
        iconName: 'palette',
        label: '拼图',
        onPress: () => {
          toggleFab(false);
          const ids = usePhotoStore.getState().photos.filter((p) => !p.isDeleted).slice(0, 9).map((p) => p.id);
          if (ids.length >= 2) navigation.navigate('Collage', { photoIds: ids });
        },
      },
      {
        id: 'slideshow',
        iconName: 'play',
        label: '幻灯片',
        onPress: () => {
          toggleFab(false);
          const ids = usePhotoStore.getState().photos.filter((p) => !p.isDeleted).map((p) => p.id);
          if (ids.length > 0) navigation.navigate('Slideshow', { photoIds: ids });
        },
      },
      {
        id: 'dedup',
        iconName: 'scan',
        label: '去重扫描',
        onPress: () => { toggleFab(false); useUiStore.getState().setDedupOverlayVisible(true); },
      },
      {
        id: 'storage',
        iconName: 'box',
        label: '存储管理',
        onPress: () => { toggleFab(false); navigation.navigate('StorageDashboard'); },
      },
    ],
    [navigation, toggleFab, importFromGallery, importFromCamera],
  );

  return (
    <View
      collapsable={false}
      pointerEvents="box-none"
      style={styles.wrapper}
    >
      {isFabOpen && (
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => toggleFab(false)}
        />
      )}

      {isFabOpen && (
        <View style={styles.menuArea} pointerEvents="auto">
          {actions.map((action, index) => (
            <FabMenuItem
              key={action.id}
              action={action}
              index={index}
              isOpen={isFabOpen}
              theme={theme}
              tokens={tokens}
            />
          ))}
        </View>
      )}

      <Pressable
        onPress={() => toggleFab()}
        android_ripple={{ color: tokens.ripple, borderless: true }}
      >
        <Animated.View style={[styles.fab, { backgroundColor: bgColor, borderRadius, transform: [{ rotate }], shadowColor: theme.colors.primary }]}>
          <LineIcon name="plus" size={28} color={theme.colors.onPrimary} />
        </Animated.View>
      </Pressable>

      <ImportProgressModal
        visible={isImporting}
        progress={progress}
        importedCount={progress?.current ?? 0}
        onComplete={cancelImport}
        onCancel={cancelImport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: FAB_BOTTOM,
    right: FAB_RIGHT,
    alignItems: 'flex-end',
    zIndex: 40,
    backgroundColor: 'transparent',
  },
  menuArea: {
    marginBottom: 14,
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  labelPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '500',
  },
  itemCircle: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
});
