import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, Text, LayoutChangeEvent, TextInput, Modal, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { MainTabParamList } from '../types';
import { LineIcon } from '../components/shared/LineIcon';
import { PhotosScreen } from '../screens/PhotosScreen';
import { AlbumsScreen } from '../screens/AlbumsScreen';
import { MapJourneysScreen } from '../screens/MapJourneysScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { usePhotoImport } from '../hooks/usePhotoImport';
import { usePhotoStore } from '../store/photoStore';
import { useAlbumStore } from '../store/albumStore';
import { useUiStore } from '../store/uiStore';
import { hapticLight, hapticSelection, hapticSuccess, hapticWarning } from '../services/haptics';
import { useAppTheme } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_CONFIG = [
  { key: 'PhotosTab' as const, label: '照片', icon: 'photo' },
  { key: 'AlbumsTab' as const, label: '相册', icon: 'image' },
  { key: 'MapJourneysTab' as const, label: '足迹', icon: 'map' },
];

const SELECTION_ACTIONS = [
  { key: 'selectAll', label: '全选', icon: 'check-circle' },
  { key: 'favorite', label: '收藏', icon: 'heart' },
  { key: 'hide', label: '隐藏', icon: 'eye-off' },
  { key: 'delete', label: '删除', icon: 'trash' },
];

const BAR_HEIGHT = 52;
const SLIDER_INSET = 4;
const SLIDER_HEIGHT = BAR_HEIGHT - SLIDER_INSET * 2;
const SPRING_CONFIG = { damping: 18, stiffness: 220, mass: 0.8 };

type FilterType = 'all' | 'photos' | 'videos' | 'live' | 'favorites';

const MENU_ITEMS: { key: FilterType; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: 'photo' },
  { key: 'photos', label: '照片', icon: 'image' },
  { key: 'videos', label: '视频', icon: 'camera' },
  { key: 'live', label: '实况', icon: 'live-photo' },
  { key: 'favorites', label: '收藏', icon: 'heart' },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { md3Theme: theme, tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const containerWidthRef = useRef(0);
  const currentIndexRef = useRef(state.index);
  const isFirstRender = useRef(true);
  currentIndexRef.current = state.index;

  const sliderX = useSharedValue(0);
  const sliderW = useSharedValue(0);
  const menuScale = useSharedValue(1);
  const popupOpacity = useSharedValue(0);
  const popupTranslateY = useSharedValue(20);
  const normalBarOpacity = useSharedValue(1);
  const selectBarOpacity = useSharedValue(0);
  const tabBarTranslateY = useSharedValue(0);
  const tabBarOpacity = useSharedValue(1);
  const tabBarScale = useSharedValue(1);
  const menuOpenProgress = useSharedValue(0);

  const [showPopup, setShowPopup] = useState(false);
  const [showImportSub, setShowImportSub] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const isAlbumsTab = state.routes[state.index]?.name === 'AlbumsTab';
  const isMapTab = state.routes[state.index]?.name === 'MapJourneysTab';
  const isTabBarHidden = useUiStore((s) => s.isTabBarHidden);
  const requestMapPreviewPinDropPoint = useUiStore((s) => s.requestMapPreviewPinDropPoint);
  const filter = usePhotoStore((s) => s.filter);
  const setFilter = usePhotoStore((s) => s.setFilter);
  const resetFilter = usePhotoStore((s) => s.resetFilter);
  const selectionMode = usePhotoStore((s) => s.selectionMode);
  const selectedIds = usePhotoStore((s) => s.selectedIds);
  const exitSelection = usePhotoStore((s) => s.exitSelection);
  const selectAll = usePhotoStore((s) => s.selectAll);
  const batchFavorite = usePhotoStore((s) => s.batchFavorite);
  const batchHide = usePhotoStore((s) => s.batchHide);
  const batchDelete = usePhotoStore((s) => s.batchDelete);
  const photos = usePhotoStore((s) => s.photos);
  const showToast = useUiStore((s) => s.showToast);
  const createAlbum = useAlbumStore((s) => s.createAlbum);
  const { importFromGallery, importFromCamera } = usePhotoImport();

  useEffect(() => {
    if (selectionMode) {
      normalBarOpacity.value = withTiming(0, { duration: 200 });
      selectBarOpacity.value = withTiming(1, { duration: 200 });
      setShowPopup(false);
      setShowImportSub(false);
    } else {
      normalBarOpacity.value = withTiming(1, { duration: 200 });
      selectBarOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [selectionMode]);

  const normalBarStyle = useAnimatedStyle(() => ({
    opacity: normalBarOpacity.value,
    pointerEvents: normalBarOpacity.value > 0.5 ? 'auto' : 'none',
  }));

  const selectBarStyle = useAnimatedStyle(() => ({
    opacity: selectBarOpacity.value,
    pointerEvents: selectBarOpacity.value > 0.5 ? 'auto' : 'none',
  }));

  const repositionSlider = (index: number, animated: boolean) => {
    const cw = containerWidthRef.current;
    if (cw <= 0) return;
    const tabWidth = cw / TAB_CONFIG.length;
    const targetX = tabWidth * index + SLIDER_INSET;
    const targetW = tabWidth - SLIDER_INSET * 2;
    if (animated) {
      sliderX.value = withSpring(targetX, SPRING_CONFIG);
      sliderW.value = withSpring(targetW, SPRING_CONFIG);
    } else {
      sliderX.value = targetX;
      sliderW.value = targetW;
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (state.index < TAB_CONFIG.length) {
      repositionSlider(state.index, true);
    }
  }, [state.index]);

  useEffect(() => {
    if (showPopup) {
      popupOpacity.value = withTiming(1, { duration: 200 });
      popupTranslateY.value = withSpring(0, SPRING_CONFIG);
      menuOpenProgress.value = withTiming(1, { duration: 180 });
    } else {
      popupOpacity.value = withTiming(0, { duration: 150 });
      popupTranslateY.value = withSpring(20, SPRING_CONFIG);
      menuOpenProgress.value = withTiming(0, { duration: 160 });
    }
  }, [showPopup]);

  useEffect(() => {
    if (isTabBarHidden) {
      setShowPopup(false);
      setShowImportSub(false);
      tabBarTranslateY.value = withTiming(110, { duration: 260 });
      tabBarOpacity.value = withTiming(0, { duration: 220 });
      tabBarScale.value = withTiming(0.96, { duration: 260 });
    } else {
      tabBarTranslateY.value = withSpring(0, SPRING_CONFIG);
      tabBarOpacity.value = withTiming(1, { duration: 220 });
      tabBarScale.value = withSpring(1, SPRING_CONFIG);
    }
  }, [isTabBarHidden]);

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    containerWidthRef.current = event.nativeEvent.layout.width;
    if (currentIndexRef.current < TAB_CONFIG.length) {
      repositionSlider(currentIndexRef.current, false);
    }
  };

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderX.value }],
    width: sliderW.value,
  }));

  const menuAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: menuScale.value }],
  }));

  const menuIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - menuOpenProgress.value,
    transform: [
      { rotate: `${menuOpenProgress.value * 90}deg` },
      { scale: 1 - menuOpenProgress.value * 0.18 },
    ],
  }));

  const closeIconStyle = useAnimatedStyle(() => ({
    opacity: menuOpenProgress.value,
    transform: [
      { rotate: `${-90 + menuOpenProgress.value * 90}deg` },
      { scale: 0.72 + menuOpenProgress.value * 0.28 },
    ],
  }));

  const popupAnimStyle = useAnimatedStyle(() => ({
    opacity: popupOpacity.value,
    transform: [{ translateY: popupTranslateY.value }],
  }));

  const containerAnimStyle = useAnimatedStyle(() => ({
    opacity: tabBarOpacity.value,
    transform: [{ translateY: tabBarTranslateY.value }, { scale: tabBarScale.value }],
  }));

  const handleMenuPress = useCallback(() => {
    menuScale.value = withSpring(0.9, SPRING_CONFIG, () => {
      menuScale.value = withSpring(1, SPRING_CONFIG);
    });
    hapticLight();
    setShowPopup((v) => {
      if (v) setShowImportSub(false);
      return !v;
    });
  }, [menuScale]);

  const handleFilter = useCallback((key: FilterType) => {
    if (key === 'all') {
      resetFilter();
    } else if (key === 'photos') {
      setFilter({ mediaType: 'photo' });
    } else if (key === 'videos') {
      setFilter({ mediaType: 'video' });
    } else if (key === 'favorites') {
      setFilter({ isFavorite: true });
    } else if (key === 'live') {
      setFilter({ mediaType: 'live' });
    }
    setShowPopup(false);
  }, [setFilter, resetFilter]);

  const handleImportExpand = useCallback(() => {
    setShowImportSub((v) => !v);
  }, []);

  const handleImport = useCallback(() => {
    setShowPopup(false);
    setShowImportSub(false);
    importFromGallery();
  }, [importFromGallery]);

  const handleCamera = useCallback(() => {
    setShowPopup(false);
    setShowImportSub(false);
    importFromCamera();
  }, [importFromCamera]);

  const handleCreateAlbum = useCallback(() => {
    setShowPopup(false);
    setShowImportSub(false);
    setAlbumName('');
    setShowNameModal(true);
  }, []);

  const confirmCreateAlbum = useCallback(() => {
    const name = albumName.trim() || '新建相册';
    const album = createAlbum(name);
    setShowNameModal(false);
    setAlbumName('');
    showToast('已创建相册', 'success');
    navigation.navigate('AlbumsTab', {
      screen: 'AlbumDetail',
      params: { albumId: album.id },
    });
  }, [albumName, createAlbum, showToast, navigation]);

  const isFilterActive = useCallback((key: FilterType) => {
    if (!filter) return key === 'all';
    if (key === 'all') return !filter.mediaType && !filter.isFavorite;
    if (key === 'photos') return filter.mediaType === 'photo';
    if (key === 'videos') return filter.mediaType === 'video';
    if (key === 'favorites') return filter.isFavorite === true;
    if (key === 'live') return filter.mediaType === 'live';
    return false;
  }, [filter]);

  const handleSelectAll = useCallback(() => {
    selectAll(photos.filter((p) => !p.isDeleted).map((p) => p.id));
  }, [selectAll, photos]);

  const handleBatchFavorite = useCallback(() => {
    batchFavorite();
    hapticSuccess();
    showToast('已更新收藏', 'success');
  }, [batchFavorite, showToast]);

  const handleBatchHide = useCallback(() => {
    batchHide();
    hapticSelection();
    showToast('已隐藏', 'success');
  }, [batchHide, showToast]);

  const handleBatchDelete = useCallback(() => {
    batchDelete();
    hapticWarning();
    showToast('已移至回收站', 'success');
  }, [batchDelete, showToast]);

  const handleSelectionAction = useCallback((key: string) => {
    switch (key) {
      case 'selectAll': handleSelectAll(); break;
      case 'favorite': handleBatchFavorite(); break;
      case 'hide': handleBatchHide(); break;
      case 'delete': handleBatchDelete(); break;
    }
  }, [handleSelectAll, handleBatchFavorite, handleBatchHide, handleBatchDelete]);

  const pinSize = BAR_HEIGHT;
  const pinDockX = windowWidth - 20 - pinSize;
  const pinDockY = windowHeight - 120 - pinSize;
  const pinDropBottomLimit = pinDockY;
  const pinMinX = pinDockX;
  const pinMaxX = pinDockX;
  const pinMinY = Math.max(insets.top + 12, pinDockY - 200);
  const pinMaxY = pinDockY;

  const pinX = useSharedValue(pinDockX);
  const pinY = useSharedValue(pinDockY);
  const pinStartX = useSharedValue(pinDockX);
  const pinStartY = useSharedValue(pinDockY);

  useEffect(() => {
    pinX.value = withSpring(pinDockX, SPRING_CONFIG);
    pinY.value = withSpring(pinDockY, SPRING_CONFIG);
  }, [pinDockX, pinDockY, pinX, pinY]);

  const resetPinToDock = useCallback(() => {
    pinX.value = withSpring(pinDockX, SPRING_CONFIG);
    pinY.value = withSpring(pinDockY, SPRING_CONFIG);
  }, [pinDockX, pinDockY, pinX, pinY]);

  const commitPreviewPin = useCallback((centerX: number, centerY: number) => {
    requestMapPreviewPinDropPoint({ x: centerX, y: centerY });
  }, [requestMapPreviewPinDropPoint]);

  const pinGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(10)
        .onStart(() => {
          pinStartX.value = pinX.value;
          pinStartY.value = pinY.value;
        })
        .onUpdate((event) => {
          pinX.value = Math.max(pinMinX, Math.min(pinMaxX, pinStartX.value + event.translationX));
          pinY.value = Math.max(pinMinY, Math.min(pinMaxY, pinStartY.value + event.translationY));
        })
        .onEnd(() => {
          const centerX = pinX.value + pinSize / 2;
          const centerY = pinY.value + pinSize / 2;
          if (centerY <= pinDropBottomLimit) {
            runOnJS(commitPreviewPin)(centerX, centerY);
          }
          pinX.value = withSpring(pinDockX, SPRING_CONFIG);
          pinY.value = withSpring(pinDockY, SPRING_CONFIG);
        }),
    [
      commitPreviewPin,
      pinDockX,
      pinDockY,
      pinDropBottomLimit,
      pinMaxX,
      pinMaxY,
      pinMinX,
      pinMinY,
      pinSize,
      pinStartX,
      pinStartY,
      pinX,
      pinY,
    ],
  );

  const pinFabStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pinX.value }, { translateY: pinY.value }],
  }));

  return (
    <Animated.View
      style={[styles.outerContainer, { paddingBottom: insets.bottom }, containerAnimStyle]}
      pointerEvents={isTabBarHidden ? 'none' : 'box-none'}
    >
      {showPopup && (
        <Pressable style={styles.popupOverlay} onPress={() => setShowPopup(false)} />
      )}

      <Animated.View style={[styles.rowWrap, normalBarStyle]}>
        <View style={styles.row}>
          <View style={[styles.capsule, { backgroundColor: theme.colors.primary }]} onLayout={handleContainerLayout}>
            <Animated.View style={[styles.slider, { backgroundColor: tokens.ripple }, sliderStyle]} />
            {TAB_CONFIG.map((config, index) => {
              const route = state.routes.find((r) => r.name === config.key);
              if (!route) return null;
              const isFocused = state.index === index;

              const onPress = () => {
                hapticLight();
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              const onLongPress = () => {
                navigation.emit({ type: 'tabLongPress', target: route.key });
              };

              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={styles.tabItem}
                >
                  {isFocused ? (
                    <LineIcon name={config.icon} size={20} color={theme.colors.onPrimary} />
                  ) : (
                    <Text style={[styles.tabLabel, { color: theme.colors.onPrimary + '80' }]}>
                      {config.label}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          {isMapTab ? (
            <View style={styles.menuSpacer} />
          ) : (
            <Pressable onPress={handleMenuPress} style={styles.menuOuter}>
              <Animated.View
                style={[
                  styles.menuCircle,
                  { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary },
                  menuAnimStyle,
                ]}
              >
                <Animated.View style={[styles.menuIconLayer, menuIconStyle]}>
                  <LineIcon name="menu" size={20} color={theme.colors.onPrimary} />
                </Animated.View>
                <Animated.View style={[styles.menuIconLayer, closeIconStyle]}>
                  <LineIcon name="close" size={20} color={theme.colors.onPrimary} />
                </Animated.View>
              </Animated.View>
            </Pressable>
          )}
        </View>
      </Animated.View>

      {isMapTab && !selectionMode ? (
        <GestureDetector gesture={pinGesture}>
          <Animated.View style={[styles.mapPreviewPinFab, pinFabStyle]}>
            <Pressable
              style={[styles.mapPreviewPinCircle, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
              onPress={() => requestMapPreviewPinDropPoint({ x: pinDockX + pinSize / 2, y: pinDockY + pinSize / 2 })}
            >
              <LineIcon name="pin" size={20} color={theme.colors.onPrimary} />
            </Pressable>
          </Animated.View>
        </GestureDetector>
      ) : null}

      <Animated.View style={[styles.rowWrap, selectBarStyle]}>
        <View style={styles.row}>
          <View style={[styles.selectCapsule, { backgroundColor: theme.colors.surfaceContainerLowest }]}>
            <Pressable style={styles.selectCancelBtn} onPress={() => { hapticSelection(); exitSelection(); }}>
              <Text style={[styles.selectCancelText, { color: theme.colors.onSurface }]}>取消</Text>
            </Pressable>
            <Text style={[styles.selectCount, { color: theme.colors.outline }]}>{selectedIds.size} 项</Text>
            {SELECTION_ACTIONS.map((action) => (
              <Pressable
                key={action.key}
                style={[styles.selectActionBtn, { backgroundColor: tokens.ripple }]}
                onPress={() => handleSelectionAction(action.key)}
              >
                <LineIcon
                  name={action.icon}
                  size={20}
                  color={action.key === 'delete' ? theme.colors.error : theme.colors.onSurface}
                />
              </Pressable>
            ))}
          </View>
        </View>
      </Animated.View>

      {showPopup && (
        <Animated.View style={[styles.popup, { backgroundColor: theme.colors.surfaceContainerLowest }, popupAnimStyle]}>
          {isAlbumsTab ? (
            <Pressable style={styles.popupItem} onPress={handleCreateAlbum}>
              <LineIcon name="folder-plus" size={18} color={theme.colors.onSurface} />
              <Text style={[styles.popupItemText, { color: theme.colors.outline }]}>新建相册</Text>
            </Pressable>
          ) : (
            <>
              <Pressable style={styles.popupItem} onPress={handleImportExpand}>
                <LineIcon name="plus" size={18} color={theme.colors.onSurface} />
                <Text style={[styles.popupItemText, { color: theme.colors.outline }]}>导入图片</Text>
                <LineIcon
                  name="chevron-left"
                  size={14}
                  color={showImportSub ? theme.colors.onSurface : theme.colors.outline}
                  style={{ marginLeft: 'auto' }}
                />
              </Pressable>
              <View style={[styles.popupDivider, { backgroundColor: theme.colors.surfaceVariant }]} />
              <Pressable style={[styles.popupItem, styles.photosMenuHiddenItem]} onPress={handleCreateAlbum}>
                <LineIcon name="folder-plus" size={18} color={theme.colors.onSurface} />
                <Text style={[styles.popupItemText, { color: theme.colors.outline }]}>新建相册</Text>
              </Pressable>
              <View style={[styles.popupDivider, { backgroundColor: theme.colors.surfaceVariant }]} />
              {MENU_ITEMS.map((item) => (
                <Pressable
                  key={item.key}
                  style={[styles.popupItem, isFilterActive(item.key) && { backgroundColor: theme.colors.surface }]}
                  onPress={() => handleFilter(item.key)}
                >
                  <LineIcon
                    name={item.icon}
                    size={18}
                    color={isFilterActive(item.key) ? theme.colors.onSurface : theme.colors.outline}
                  />
                  <Text style={[styles.popupItemText, isFilterActive(item.key) && styles.popupItemTextActive, { color: isFilterActive(item.key) ? theme.colors.onSurface : theme.colors.outline }]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </>
          )}
        </Animated.View>
      )}
      {showPopup && showImportSub && (
        <Animated.View style={[styles.subPopup, { backgroundColor: theme.colors.surfaceContainerLowest }, popupAnimStyle]}>
          <Pressable style={styles.popupItem} onPress={handleCamera}>
            <LineIcon name="camera" size={18} color={theme.colors.onSurface} />
            <Text style={[styles.popupItemText, { color: theme.colors.outline }]}>拍照</Text>
          </Pressable>
          <Pressable style={styles.popupItem} onPress={handleImport}>
            <LineIcon name="image" size={18} color={theme.colors.onSurface} />
            <Text style={[styles.popupItemText, { color: theme.colors.outline }]}>图库导入</Text>
          </Pressable>
        </Animated.View>
      )}
      {showNameModal && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowNameModal(false)}>
          <Pressable style={[styles.nameModalOverlay, { backgroundColor: tokens.scrim }]} onPress={() => setShowNameModal(false)}>
            <Pressable style={[styles.nameModalCard, { backgroundColor: theme.colors.surfaceContainerLowest }]} onPress={(e) => e.stopPropagation()}>
              <Text style={[styles.nameModalTitle, { color: theme.colors.onSurface }]}>新建相册</Text>
              <TextInput
                style={[styles.nameModalInput, { borderColor: theme.colors.outlineVariant, color: theme.colors.onSurface, backgroundColor: theme.colors.surface }]}
                placeholder="输入相册名称"
                placeholderTextColor={theme.colors.outline}
                value={albumName}
                onChangeText={setAlbumName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={confirmCreateAlbum}
              />
              <View style={styles.nameModalActions}>
                <Pressable style={styles.nameModalCancel} onPress={() => setShowNameModal(false)}>
                  <Text style={[styles.nameModalCancelText, { color: theme.colors.outline }]}>取消</Text>
                </Pressable>
                <Pressable style={[styles.nameModalConfirm, { backgroundColor: theme.colors.primary }]} onPress={confirmCreateAlbum}>
                  <Text style={[styles.nameModalConfirmText, { color: theme.colors.onPrimary }]}>创建</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </Animated.View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: true,
      }}
    >
      <Tab.Screen name="PhotosTab" component={PhotosScreen} />
      <Tab.Screen name="AlbumsTab" component={AlbumsScreen} />
      <Tab.Screen name="MapJourneysTab" component={MapJourneysScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 999,
    elevation: 12,
  },
  popupOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  rowWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 14,
    gap: 4,
  },
  capsule: {
    flex: 1,
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  slider: {
    position: 'absolute',
    top: SLIDER_INSET,
    height: SLIDER_HEIGHT,
    borderRadius: 999,
  },
  tabItem: {
    flex: 1,
    height: BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '400',
    includeFontPadding: false,
  },
  menuOuter: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -2,
  },
  menuSpacer: {
    width: BAR_HEIGHT,
    height: BAR_HEIGHT,
  },
  menuCircle: {
    width: BAR_HEIGHT,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  menuIconLayer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photosMenuHiddenItem: {
    display: 'none',
  },
  mapPreviewPinFab: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: BAR_HEIGHT,
    height: BAR_HEIGHT,
    zIndex: 1001,
  },
  mapPreviewPinCircle: {
    width: BAR_HEIGHT,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  selectCapsule: {
    flex: 1,
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 8,
    gap: 2,
  },
  selectCancelBtn: {
    paddingHorizontal: 14,
    height: BAR_HEIGHT,
    justifyContent: 'center',
  },
  selectCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectCount: {
    fontSize: 14,
    fontWeight: '400',
    marginRight: 4,
  },
  selectActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    position: 'absolute',
    right: 20,
    bottom: BAR_HEIGHT + 24,
    width: 180,
    borderRadius: 16,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  popupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  popupItemText: {
    fontSize: 14,
    fontWeight: '400',
  },
  popupItemTextActive: {
    fontWeight: '600',
  },
  popupDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 12,
    marginVertical: 4,
  },
  subPopup: {
    position: 'absolute',
    right: 20 + 180 + 4,
    bottom: BAR_HEIGHT + 24,
    width: 150,
    borderRadius: 16,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  nameModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  nameModalCard: {
    width: '80%',
    borderRadius: 20,
    padding: 24,
  },
  nameModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  nameModalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  nameModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  nameModalCancel: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  nameModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  nameModalConfirm: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  nameModalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
