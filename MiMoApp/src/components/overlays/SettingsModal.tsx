import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMd3Theme } from '../../theme';
import { useUiStore, useSettingsStore } from '../../store';
import { THEME_NAMES, THEME_LABELS, GRID } from '../../utils/constants';
import { APP_VERSION } from '../../utils/constants';
import type { ThemeName } from '../../types';

export function SettingsModal() {
  const insets = useSafeAreaInsets();
  const isVisible = useUiStore((s) => s.isSettingsModalVisible);

  if (!isVisible) return null;

  return <SettingsModalContent />;
}

function SettingsModalContent() {
  const insets = useSafeAreaInsets();
  const theme = useMd3Theme();
  const isVisible = useUiStore((s) => s.isSettingsModalVisible);
  const setVisible = useUiStore((s) => s.setSettingsModalVisible);
  const settings = useSettingsStore();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setVisible(false)}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: theme.colors.outlineVariant }]}>
          <Pressable onPress={() => setVisible(false)}>
            <Text style={[styles.closeBtn, { color: theme.colors.primary }]}>完成</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>设置</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {/* ---- 主题 ---- */}
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>主题配色</Text>
          <View style={styles.themeRow}>
            {THEME_NAMES.map((name) => (
              <Pressable
                key={name}
                style={[
                  styles.themeChip,
                  {
                    backgroundColor:
                      settings.theme === name ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                    borderColor:
                      settings.theme === name ? theme.colors.primary : 'transparent',
                  },
                ]}
                onPress={() => settings.setTheme(name)}
              >
                <Text
                  style={[
                    styles.themeChipText,
                    {
                      color:
                        settings.theme === name
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {THEME_LABELS[name]}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ---- 网格列数 ---- */}
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>照片网格列数</Text>
          <View style={styles.gridRow}>
            {Array.from({ length: GRID.MAX_COLUMNS - GRID.MIN_COLUMNS + 1 }).map((_, i) => {
              const cols = GRID.MIN_COLUMNS + i;
              return (
                <Pressable
                  key={cols}
                  style={[
                    styles.gridChip,
                    {
                      backgroundColor:
                        settings.gridColumns === cols
                          ? theme.colors.primaryContainer
                          : theme.colors.surfaceVariant,
                    },
                  ]}
                  onPress={() => settings.setGridColumns(cols)}
                >
                  <Text
                    style={[
                      styles.gridChipText,
                      {
                        color:
                          settings.gridColumns === cols
                            ? theme.colors.onPrimaryContainer
                            : theme.colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {cols}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ---- 安全 ---- */}
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>安全</Text>
          <View style={[styles.row, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>PIN 锁屏</Text>
              <Text style={[styles.rowSub, { color: theme.colors.onSurfaceVariant }]}>
                打开应用时验证 PIN 码
              </Text>
            </View>
            <Switch
              value={settings.pinEnabled}
              onValueChange={settings.setPinEnabled}
              trackColor={{ true: theme.colors.primary }}
            />
          </View>
          <View style={[styles.row, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>指纹/面容识别</Text>
              <Text style={[styles.rowSub, { color: theme.colors.onSurfaceVariant }]}>
                使用生物识别解锁
              </Text>
            </View>
            <Switch
              value={settings.biometricEnabled}
              onValueChange={settings.setBiometricEnabled}
              trackColor={{ true: theme.colors.primary }}
            />
          </View>

          {/* ---- 显示 ---- */}
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>显示</Text>
          <View style={[styles.row, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>FAB 标签</Text>
              <Text style={[styles.rowSub, { color: theme.colors.onSurfaceVariant }]}>
                浮动按钮显示文字标签
              </Text>
            </View>
            <Switch
              value={settings.showFabLabels}
              onValueChange={settings.setShowFabLabels}
              trackColor={{ true: theme.colors.primary }}
            />
          </View>

          {/* ---- 关于 ---- */}
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>关于</Text>
          <View style={[styles.row, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>Momento 相册</Text>
              <Text style={[styles.rowSub, { color: theme.colors.onSurfaceVariant }]}>
                AI 智能相册 · 隐私优先
              </Text>
            </View>
            <Text style={[styles.version, { color: theme.colors.onSurfaceVariant }]}>v{APP_VERSION}</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,

    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  closeBtn: { fontSize: 15, fontWeight: '500' },
  title: { fontSize: 17, fontWeight: '700' },
  body: { padding: 16, paddingBottom: 80 },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 10, marginTop: 20 },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  themeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  themeChipText: { fontSize: 13, fontWeight: '600' },
  gridRow: { flexDirection: 'row', gap: 12 },
  gridChip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridChipText: { fontSize: 18, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  rowLeft: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },
  version: { fontSize: 13 },
});
