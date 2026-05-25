import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
} from 'react-native';
import { useMd3Theme } from '../theme';
import { useSettingsStore } from '../store';
import { THEME_NAMES, THEME_LABELS, GRID, APP_VERSION } from '../utils/constants';
import type { RootStackScreenProps } from '../navigation/types';
import { Toolbar } from '../components/shared/Toolbar';
import { DataExportModal } from '../components/overlays/DataExportModal';
import type { ThemeName } from '../types';

// 全屏设置页（与 SettingsModal 内容相同，独立路由）
export function SettingsScreen({ navigation }: RootStackScreenProps<'Settings'>) {
  const theme = useMd3Theme();
  const settings = useSettingsStore();
  const [exportVisible, setExportVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Toolbar title="设置" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        {/* 主题 */}
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

        {/* 网格列数 */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>网格列数</Text>
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

        {/* 安全 */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>安全</Text>
        <SettingRow theme={theme} title="PIN 锁屏" subtitle="打开应用时验证 PIN 码">
          <Switch
            value={settings.pinEnabled}
            onValueChange={settings.setPinEnabled}
            trackColor={{ true: theme.colors.primary }}
          />
        </SettingRow>
        <SettingRow theme={theme} title="面容/指纹" subtitle="生物识别解锁">
          <Switch
            value={settings.biometricEnabled}
            onValueChange={settings.setBiometricEnabled}
            trackColor={{ true: theme.colors.primary }}
          />
        </SettingRow>

        {/* 显示 */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>显示</Text>
        <SettingRow theme={theme} title="瀑布流布局" subtitle="照片按原始比例交错排列">
          <Switch
            value={settings.masonryEnabled}
            onValueChange={settings.setMasonryEnabled}
            trackColor={{ true: theme.colors.primary }}
          />
        </SettingRow>
        <SettingRow theme={theme} title="FAB 标签" subtitle="浮动按钮显示文字">
          <Switch
            value={settings.showFabLabels}
            onValueChange={settings.setShowFabLabels}
            trackColor={{ true: theme.colors.primary }}
          />
        </SettingRow>

        {/* 数据 */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>数据</Text>
        <SettingRow theme={theme} title="导出备份" subtitle="导出照片元数据和相册结构">
          <Pressable
            style={[styles.exportBtn, { backgroundColor: theme.colors.primaryContainer }]}
            onPress={() => setExportVisible(true)}
          >
            <Text style={[styles.exportBtnText, { color: theme.colors.onPrimaryContainer }]}>
              导出
            </Text>
          </Pressable>
        </SettingRow>

        {/* 关于 */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>关于</Text>
        <SettingRow theme={theme} title="Momento 相册" subtitle="AI 智能相册 · 隐私优先">
          <Text style={[styles.version, { color: theme.colors.onSurfaceVariant }]}>v{APP_VERSION}</Text>
        </SettingRow>
      </ScrollView>
      <DataExportModal visible={exportVisible} onClose={() => setExportVisible(false)} />
    </View>
  );
}

function SettingRow({
  theme,
  title,
  subtitle,
  children,
}: {
  theme: any;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[settingStyles.row, { backgroundColor: theme.colors.surfaceVariant }]}>
      <View style={settingStyles.left}>
        <Text style={[settingStyles.title, { color: theme.colors.onSurface }]}>{title}</Text>
        <Text style={[settingStyles.subtitle, { color: theme.colors.onSurfaceVariant }]}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  left: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 12, marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 16, paddingBottom: 80 },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 10, marginTop: 20 },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  themeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
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
  version: { fontSize: 13 },
  exportBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  exportBtnText: { fontSize: 13, fontWeight: '600' },
});
