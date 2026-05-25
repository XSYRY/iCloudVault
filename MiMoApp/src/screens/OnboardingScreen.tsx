import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useMd3Theme } from '../theme';
import { useSettingsStore } from '../store';
import type { RootStackScreenProps } from '../navigation/types';

// ============================================================
// OnboardingScreen — 3 页新手引导
// 后期扩展：增加更多页面或替换为 Lottie 动画
// ============================================================

const PAGES = [
  { title: '欢迎使用 Momento', desc: 'AI 智能相册，让你的照片井井有条' },
  { title: '本地 AI 识别', desc: '使用手机算力，照片不离开设备，安全又私密' },
  { title: '智能搜索', desc: '用自然语言搜索照片，比如"去年在海边拍的日落"' },
];

export function OnboardingScreen({ navigation }: RootStackScreenProps<'Onboarding'>) {
  const theme = useMd3Theme();
  const setComplete = useSettingsStore((s) => s.setOnboardingComplete);
  const [page, setPage] = useState(0);

  const handleNext = () => {
    if (page < PAGES.length - 1) {
      setPage(page + 1);
    } else {
      setComplete(true);
      navigation.replace('Main');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>{PAGES[page].title}</Text>
        <Text style={[styles.desc, { color: theme.colors.onSurfaceVariant }]}>{PAGES[page].desc}</Text>

        {/* 页面指示器 */}
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === page ? theme.colors.primary : theme.colors.surfaceVariant,
                  width: i === page ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <Pressable
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={handleNext}
      >
        <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
          {page < PAGES.length - 1 ? '下一步' : '开始使用'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  content: { alignItems: 'center', marginBottom: 64 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  desc: { fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 24 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 40 },
  dot: { height: 8, borderRadius: 999 },
  button: { paddingHorizontal: 48, paddingVertical: 16, borderRadius: 999 },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
