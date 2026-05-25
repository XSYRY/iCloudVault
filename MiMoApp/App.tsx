/**
 * Momento 相册 — React Native App 根组件
 *
 * Provider 层叠：
 *   GestureHandlerRootView → SafeAreaProvider → PaperProvider → ThemeProvider → NavigationContainer
 *
 * 启动流程：
 *   App → AppBootstrap (useAppInit: 加载设置 + mock 数据) → ThemeGate → RootNavigator
 */
import React, { useRef, useEffect } from 'react';
import { StatusBar, StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { ThemeProvider, useAppTheme } from './src/theme';
import { RootNavigator } from './src/navigation';
import { useSettingsStore } from './src/store';
import { useAppInit } from './src/hooks/useAppInit';
import { ErrorBoundary } from './src/components/shared/ErrorBoundary';
import { LogBox } from 'react-native';
import type { ThemeName } from './src/types';

LogBox.ignoreLogs(['JSI SQLiteAdapter', 'WatermelonDB']);

/* ───────────────────────────────
   启动加载页
   ─────────────────────────────── */
function SplashScreen() {
  const floatY = useRef(new Animated.Value(0)).current;
  const floatRotate = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const dots = useRef([new Animated.Value(0.3), new Animated.Value(0.3), new Animated.Value(0.3)]).current;

  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(floatY, {
            toValue: -12,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatRotate, {
            toValue: 1,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(floatY, {
            toValue: 0,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatRotate, {
            toValue: 0,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    const fade = Animated.timing(fadeIn, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    float.start();
    fade.start();

    const dotLoops = dots.map((dot, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(i * 280),
          Animated.timing(dot, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return loop;
    });

    return () => {
      float.stop();
      fade.stop();
      dotLoops.forEach((l) => l.stop());
    };
  }, [floatY, floatRotate, fadeIn, dots]);

  const rotate = floatRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2.5deg', '2.5deg'],
  });

  return (
    <View style={ss.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6F3" />

      {/* 浮动宝丽来卡片 */}
      <Animated.View
        style={[
          ss.cardWrap,
          { transform: [{ translateY: floatY }, { rotate }] },
        ]}
      >
        <View style={ss.polaroid}>
          {/* 照片区域 */}
          <View style={ss.photoArea}>
            <LinearGradient
              colors={['#FDF4E7', '#F0DCC8', '#E8CFB0']}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />

            {/* 远山 (左) */}
            <View style={ss.mountainFar} />
            {/* 远山阴影面 */}
            <View style={ss.mountainFarShadow} />

            {/* 近山 (右) */}
            <View style={ss.mountainNear} />
            {/* 近山阴影面 */}
            <View style={ss.mountainNearShadow} />

            {/* 地面 */}
            <View style={ss.ground} />
            {/* 地面近景 */}
            <View style={ss.groundNear} />
          </View>

          {/* 宝丽来底部标签 */}
          <View style={ss.polaroidLabel}>
            <Text style={ss.polaroidLabelText}>旅行记忆</Text>
          </View>
        </View>
      </Animated.View>

      {/* 标题 */}
      <Animated.Text style={[ss.title, { opacity: fadeIn }]}>
        Momento 相册
      </Animated.Text>
      <Animated.Text style={[ss.subtitle, { opacity: fadeIn }]}>
        珍藏每一段旅途
      </Animated.Text>

      {/* 呼吸点 */}
      <View style={ss.dotsRow}>
        {dots.map((dot, i) => (
          <Animated.View key={i} style={[ss.dot, { opacity: dot }]} />
        ))}
      </View>
    </View>
  );
}

const ss = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F3',
  },

  /* 卡片包裹 */
  cardWrap: {
    marginBottom: 36,
    shadowColor: '#3A2E1A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },

  /* 宝丽来卡片 */
  polaroid: {
    backgroundColor: '#FEFCF8',
    borderRadius: 4,
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 40,
    width: 200,
    alignItems: 'center',
  },

  /* 照片区域 */
  photoArea: {
    width: 180,
    height: 180,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#FDF4E7',
  },

  /* 远山 — 旋转方形 */
  mountainFar: {
    position: 'absolute',
    top: 76,
    left: -36,
    width: 130,
    height: 130,
    backgroundColor: '#C4A882',
    transform: [{ rotate: '45deg' }],
  },
  mountainFarShadow: {
    position: 'absolute',
    top: 76,
    left: -14,
    width: 130,
    height: 130,
    backgroundColor: '#B8976E',
    transform: [{ rotate: '45deg' }],
  },

  /* 近山 — 旋转方形 */
  mountainNear: {
    position: 'absolute',
    top: 94,
    right: -46,
    width: 140,
    height: 140,
    backgroundColor: '#6B5B3E',
    transform: [{ rotate: '45deg' }],
  },
  mountainNearShadow: {
    position: 'absolute',
    top: 94,
    right: -20,
    width: 140,
    height: 140,
    backgroundColor: '#5A4E3C',
    transform: [{ rotate: '45deg' }],
  },

  /* 地面 */
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 16,
    backgroundColor: '#7A6950',
    opacity: 0.55,
  },
  groundNear: {
    position: 'absolute',
    bottom: 0,
    left: -4,
    right: -4,
    height: 6,
    backgroundColor: '#8B7355',
    opacity: 0.7,
  },

  /* 宝丽来标签 */
  polaroidLabel: {
    marginTop: 14,
  },
  polaroidLabelText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9E9E9E',
    letterSpacing: 1,
    fontStyle: 'italic',
  },

  /* 标题 */
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#2C3E35',
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8B7355',
    letterSpacing: 2,
  },

  /* 呼吸点 */
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 48,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#C4A882',
  },
});

/* ───────────────────────────────
   启动引导
   ─────────────────────────────── */
function AppBootstrap() {
  const ready = useAppInit();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  if (!ready) {
    return <SplashScreen />;
  }

  return <ThemeGate themeName={theme} setThemeName={setTheme} />;
}

function ThemeGate({
  themeName,
  setThemeName,
}: {
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
}) {
  return (
    <ThemeProvider themeName={themeName} setThemeName={setThemeName}>
      <ThemeGateInner />
    </ThemeProvider>
  );
}

function ThemeGateInner() {
  const { md3Theme, isDark } = useAppTheme();

  return (
    <PaperProvider theme={md3Theme}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={md3Theme.colors.background}
      />
      <ErrorBoundary>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </ErrorBoundary>
    </PaperProvider>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={globalStyles.root}>
      <SafeAreaProvider>
        <AppBootstrap />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const globalStyles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
