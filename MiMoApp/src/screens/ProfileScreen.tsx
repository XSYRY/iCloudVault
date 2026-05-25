import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, Pressable, ScrollView, Image, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSettingsStore } from '../store/settingsStore';
import { usePhotoStore } from '../store/photoStore';
import { useAlbumStore } from '../store/albumStore';
import { useUiStore } from '../store/uiStore';
import { THEME_LABELS, THEME_NAMES } from '../types';
import type { ThemeName } from '../types';
import { LineIcon } from '../components/shared/LineIcon';
import type { TabScreenProps } from '../navigation/types';
import { useAppTheme } from '../theme';

function SettingRow({
  icon,
  label,
  color,
  isLast,
  onPress,
  rightElement,
}: {
  icon: string;
  label: string;
  color: string;
  isLast: boolean;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}) {
  const { md3Theme: theme, tokens: rowTokens } = useAppTheme();
  const bg = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(44, 62, 53, ${bg.value * 0.06})`,
  }));

  const handlePressIn = () => {
    bg.value = withTiming(1, { duration: 120 });
  };

  const handlePressOut = () => {
    bg.value = withTiming(0, { duration: 200 });
  };

  return (
    <Animated.View style={[styles.rowWrap, animatedStyle]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.row}
      >
        <View style={[styles.rowIcon, { backgroundColor: color + '18' }]}>
          <LineIcon name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.rowLabel, { color: theme.colors.onSurface }]}>{label}</Text>
        {rightElement || <LineIcon name="chevron-right" size={18} color={theme.colors.outlineVariant} />}
      </Pressable>
      {!isLast && <View style={[styles.rowDivider, { backgroundColor: theme.colors.surfaceVariant }]} />}
    </Animated.View>
  );
}

function ThemePickerModal({
  visible,
  currentTheme,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentTheme: ThemeName;
  onSelect: (theme: ThemeName) => void;
  onClose: () => void;
}) {
  const { md3Theme: theme, tokens: modalTokens } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[themeModalStyles.overlay, { backgroundColor: modalTokens.scrim }]} onPress={onClose}>
        <View style={[themeModalStyles.card, { backgroundColor: theme.colors.surfaceContainerLowest }]}>
          <Text style={[themeModalStyles.title, { color: theme.colors.onSurface }]}>选择主题</Text>
          {THEME_NAMES.map((name) => {
            const isActive = name === currentTheme;
            return (
              <Pressable
                key={name}
                style={[themeModalStyles.item, isActive && { backgroundColor: theme.colors.primaryContainer }]}
                onPress={() => {
                  onSelect(name);
                  onClose();
                }}
              >
                <View style={[themeModalStyles.dot, { backgroundColor: THEME_COLORS[name] }]} />
                <Text style={[themeModalStyles.itemText, isActive && { color: theme.colors.onSurface, fontWeight: '600' }]}>
                  {THEME_LABELS[name]}
                </Text>
                {isActive && <LineIcon name="check" size={16} color={theme.colors.onSurface} />}
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

const THEME_COLORS: Record<ThemeName, string> = {
  dynamic: '#8A9E92',
  mint: '#4CAF50',
  sunset: '#FF7043',
  ocean: '#42A5F5',
  forest: '#2C3E35',
};

const themeModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    width: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    gap: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});

export function ProfileScreen({ navigation }: TabScreenProps<'ProfileTab'>) {
  const insets = useSafeAreaInsets();
  const { md3Theme: theme, tokens } = useAppTheme();
  const [themePickerVisible, setThemePickerVisible] = useState(false);

  const photos = usePhotoStore((s) => s.photos);
  const albums = useAlbumStore((s) => s.albums);
  const themeSetting = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const pinEnabled = useSettingsStore((s) => s.pinEnabled);
  const setPinEnabled = useSettingsStore((s) => s.setPinEnabled);
  const biometricEnabled = useSettingsStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useSettingsStore((s) => s.setBiometricEnabled);
  const showToast = useUiStore((s) => s.showToast);

  const stats = useMemo(() => {
    const active = photos.filter((p) => !p.isDeleted);
    const favorites = active.filter((p) => p.isFavorite).length;
    const hidden = photos.filter((p) => p.isHidden).length;
    const videos = active.filter((p) => p.mediaType === 'video').length;
    const totalSize = active.reduce((sum, p) => sum + p.sizeBytes, 0);
    return {
      total: active.length,
      favorites,
      hidden,
      videos,
      albums: albums.length,
      totalSizeMB: Math.round(totalSize / 1024 / 1024),
    };
  }, [photos, albums]);

  const formatSize = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  };

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top, backgroundColor: theme.colors.surface }]}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
          <LineIcon name="user" size={36} color={theme.colors.onSurface} />
        </View>
        <Text style={[styles.userName, { color: theme.colors.onSurface }]}>Momento 用户</Text>
        <Text style={[styles.userStats, { color: theme.colors.outline }]}>
          共 {stats.total.toLocaleString()} 张照片 · {formatSize(stats.totalSizeMB)}
        </Text>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: '相册', value: stats.albums, onPress: () => navigation.navigate('AlbumsTab') },
          { label: '收藏', value: stats.favorites, onPress: () => navigation.navigate('Favorites') },
          { label: '视频', value: stats.videos, onPress: () => {} },
          { label: '隐藏', value: stats.hidden, onPress: () => navigation.navigate('Hidden') },
        ].map((s) => (
          <Pressable key={s.label} style={styles.statItem} onPress={s.onPress}>
            <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.outline }]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.groupCard, { backgroundColor: theme.colors.surfaceContainerLowest }]}>
        <SettingRow
          icon="cloud"
          label="云端同步"
          color={theme.colors.onSurfaceVariant}
          isLast={false}
          onPress={() => navigation.navigate('StorageDashboard')}
        />
        <SettingRow
          icon="trash"
          label="回收站"
          color={theme.colors.error}
          isLast={false}
          onPress={() => navigation.navigate('StorageDashboard')}
        />
        <SettingRow
          icon="eye-off"
          label="隐藏相册"
          color={theme.colors.outline}
          isLast={true}
          onPress={() => navigation.navigate('Hidden')}
        />
      </View>

      <View style={[styles.groupCard, { backgroundColor: theme.colors.surfaceContainerLowest }]}>
        <SettingRow
          icon="lock"
          label="应用锁"
          color={pinEnabled ? theme.colors.primary : theme.colors.outline}
          isLast={false}
          onPress={() => {
            setPinEnabled(!pinEnabled);
            showToast(pinEnabled ? '已关闭应用锁' : '已开启应用锁', 'success');
          }}
          rightElement={
            <View style={[styles.toggle, { backgroundColor: pinEnabled ? theme.colors.primary : theme.colors.primaryContainer }]}>
              <View style={[styles.toggleDot, pinEnabled && styles.toggleDotActive, { backgroundColor: theme.colors.surfaceContainerLowest }]} />
            </View>
          }
        />
        <SettingRow
          icon="scan"
          label="生物识别解锁"
          color={biometricEnabled ? theme.colors.primary : theme.colors.outline}
          isLast={false}
          onPress={() => {
            setBiometricEnabled(!biometricEnabled);
            showToast(biometricEnabled ? '已关闭生物识别' : '已开启生物识别', 'success');
          }}
          rightElement={
            <View style={[styles.toggle, { backgroundColor: biometricEnabled ? theme.colors.primary : theme.colors.primaryContainer }]}>
              <View style={[styles.toggleDot, biometricEnabled && styles.toggleDotActive, { backgroundColor: theme.colors.surfaceContainerLowest }]} />
            </View>
          }
        />
        <SettingRow
          icon="palette"
          label="主题设置"
          color={theme.colors.onSurfaceVariant}
          isLast={false}
          onPress={() => setThemePickerVisible(true)}
          rightElement={
            <View style={styles.themePreview}>
              <View style={[styles.themeDot, { backgroundColor: THEME_COLORS[themeSetting] }]} />
              <Text style={[styles.themeLabel, { color: theme.colors.outline }]}>{THEME_LABELS[themeSetting]}</Text>
            </View>
          }
        />
        <SettingRow
          icon="settings"
          label="设置"
          color={theme.colors.onSurfaceVariant}
          isLast={false}
          onPress={() => navigation.navigate('Settings')}
        />
        <SettingRow
          icon="bar-chart"
          label="存储管理"
          color={theme.colors.onSurfaceVariant}
          isLast={false}
          onPress={() => navigation.navigate('StorageDashboard')}
        />
        <SettingRow
          icon="info"
          label="关于 Momento"
          color={theme.colors.onSurfaceVariant}
          isLast={true}
          onPress={() => navigation.navigate('Settings')}
        />
      </View>

      <ThemePickerModal
        visible={themePickerVisible}
        currentTheme={themeSetting}
        onSelect={(name) => {
          setTheme(name);
          showToast(`已切换为${THEME_LABELS[name]}`, 'success');
        }}
        onClose={() => setThemePickerVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
  },
  userStats: {
    fontSize: 14,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  groupCard: {
    borderRadius: 24,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  rowWrap: {
    overflow: 'hidden',
  },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
  },
  rowDivider: {
    height: 1,
    marginLeft: 64,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  toggleDotActive: {
    alignSelf: 'flex-end',
  },
  themePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  themeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeLabel: {
    fontSize: 14,
  },
});
