import React, { createContext, useContext, useMemo } from 'react';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import type { ThemeName } from '../types';

type AppMD3Colors = MD3Theme['colors'] & {
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  primaryFixed: string;
  primaryFixedDim: string;
  onPrimaryFixed: string;
  onPrimaryFixedVariant: string;
};

export type AppMD3Theme = Omit<MD3Theme, 'colors'> & {
  colors: AppMD3Colors;
};

export interface AppTokens {
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  fabBackground: string;
  fabForeground: string;
  cardElevated: string;
  badgeBackground: string;
  badgeForeground: string;
  ripple: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  scrim: string;
}

const MD3_COLORS = {
  primary: '#2C3E35',
  primaryRgb: '44, 62, 53',
  onPrimary: '#FFFFFF',
  primaryContainer: '#DDE8E0',
  onPrimaryContainer: '#2C3E35',
  primaryFixed: '#DDE8E0',
  primaryFixedDim: '#C8D8CC',
  secondary: '#5A7A6A',
  secondaryContainer: '#DDE8E0',
  onSecondaryContainer: '#2C3E35',
  tertiary: '#8A9E92',
  tertiaryContainer: '#F4F6F3',
  error: '#B3261E',
  errorContainer: '#F9DEDC',
  surface: '#F4F6F3',
  surfaceDim: '#E8ECE6',
  surfaceBright: '#F4F6F3',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F4F6F3',
  surfaceContainer: '#EFF2EC',
  surfaceContainerHigh: '#E8ECE6',
  surfaceContainerHighest: '#DDE8E0',
  surfaceVariant: '#E8ECE6',
  onSurface: '#2C3E35',
  onSurfaceVariant: '#5A7A6A',
  outline: '#8A9E92',
  outlineVariant: '#C8D8CC',
  inverseSurface: '#2C3E35',
  inverseOnSurface: '#F0F3ED',
  inversePrimary: '#C8D8CC',
  scrim: 'rgba(0,0,0,0.2)',
};

const MD3_COLORS_DARK = {
  primary: '#C8D8CC',
  onPrimary: '#1A2E24',
  primaryContainer: '#2C3E35',
  onPrimaryContainer: '#DDE8E0',
  secondary: '#A8C4B4',
  secondaryContainer: '#2C3E35',
  onSecondaryContainer: '#DDE8E0',
  tertiary: '#C8D8CC',
  tertiaryContainer: '#3A4A40',
  error: '#F2B8B5',
  errorContainer: '#8C1D18',
  surface: '#1A2E24',
  surfaceDim: '#14231C',
  surfaceBright: '#2C3E35',
  surfaceContainerLowest: '#0F1A15',
  surfaceContainerLow: '#1A2E24',
  surfaceContainer: '#223530',
  surfaceContainerHigh: '#2C3E35',
  surfaceContainerHighest: '#3A4A40',
  surfaceVariant: '#3A4A40',
  onSurface: '#DDE8E0',
  onSurfaceVariant: '#A8C4B4',
  outline: '#8A9E92',
  outlineVariant: '#3A4A40',
  inverseSurface: '#DDE8E0',
  inverseOnSurface: '#1A2E24',
  inversePrimary: '#2C3E35',
  scrim: 'rgba(0,0,0,0.4)',
};

const SHAPE_RADIUS = {
  cornerExtraSmall: 8,
  cornerSmall: 12,
  cornerMedium: 16,
  cornerLarge: 24,
  cornerExtraLarge: 32,
  cornerFull: 999,
};

const ELEVATION = {
  level0: { elevation: 0, shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowRadius: 0, shadowOpacity: 0 },
  level1: { elevation: 1, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, shadowOpacity: 0.04 },
  level2: { elevation: 3, shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, shadowOpacity: 0.05 },
  level3: { elevation: 6, shadowColor: '#000000', shadowOffset: { width: 0, height: 6 }, shadowRadius: 16, shadowOpacity: 0.06 },
  level4: { elevation: 8, shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowRadius: 24, shadowOpacity: 0.07 },
  level5: { elevation: 12, shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowRadius: 32, shadowOpacity: 0.08 },
};

const TYPOGRAPHY = {
  display: { fontSize: 28, fontWeight: '800' as const, lineHeight: 34, letterSpacing: -0.5 },
  headline: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  title: { fontSize: 18, fontWeight: '700' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  overline: { fontSize: 10, fontWeight: '500' as const, lineHeight: 14, letterSpacing: 0.5 },
};

function withExtendedColors(colors: MD3Theme['colors']): AppMD3Colors {
  return {
    ...colors,
    surfaceDim: colors.surfaceVariant,
    surfaceBright: colors.surface,
    surfaceContainerLowest: colors.background,
    surfaceContainerLow: colors.surface,
    surfaceContainer: colors.surfaceVariant,
    surfaceContainerHigh: colors.surfaceVariant,
    surfaceContainerHighest: colors.surfaceVariant,
    primaryFixed: colors.primaryContainer,
    primaryFixedDim: colors.primary,
    onPrimaryFixed: colors.onPrimaryContainer,
    onPrimaryFixedVariant: colors.primary,
  };
}

function buildThemes(): Record<ThemeName, { light: AppMD3Theme; dark: AppMD3Theme }> {
  return {
    dynamic: {
      light: {
        ...MD3LightTheme,
        colors: {
          ...MD3LightTheme.colors,
          primary: MD3_COLORS.primary,
          onPrimary: MD3_COLORS.onPrimary,
          primaryContainer: MD3_COLORS.primaryContainer,
          onPrimaryContainer: MD3_COLORS.onPrimaryContainer,
          secondary: MD3_COLORS.secondary,
          secondaryContainer: MD3_COLORS.secondaryContainer,
          onSecondaryContainer: MD3_COLORS.onSecondaryContainer,
          tertiary: MD3_COLORS.tertiary,
          tertiaryContainer: MD3_COLORS.tertiaryContainer,
          error: MD3_COLORS.error,
          errorContainer: MD3_COLORS.errorContainer,
          surface: MD3_COLORS.surface,
          surfaceVariant: MD3_COLORS.surfaceVariant,
          onSurface: MD3_COLORS.onSurface,
          onSurfaceVariant: MD3_COLORS.onSurfaceVariant,
          outline: MD3_COLORS.outline,
          outlineVariant: MD3_COLORS.outlineVariant,
          inverseSurface: MD3_COLORS.inverseSurface,
          inverseOnSurface: MD3_COLORS.inverseOnSurface,
          inversePrimary: MD3_COLORS.inversePrimary,
          surfaceDim: MD3_COLORS.surfaceDim,
          surfaceBright: MD3_COLORS.surfaceBright,
          surfaceContainerLowest: MD3_COLORS.surfaceContainerLowest,
          surfaceContainerLow: MD3_COLORS.surfaceContainerLow,
          surfaceContainer: MD3_COLORS.surfaceContainer,
          surfaceContainerHigh: MD3_COLORS.surfaceContainerHigh,
          surfaceContainerHighest: MD3_COLORS.surfaceContainerHighest,
          primaryFixed: MD3_COLORS.primaryFixed,
          primaryFixedDim: MD3_COLORS.primaryFixedDim,
          onPrimaryFixed: MD3_COLORS.onPrimaryContainer,
          onPrimaryFixedVariant: MD3_COLORS.primary,
          scrim: MD3_COLORS.scrim,
          onErrorContainer: MD3_COLORS.error,
          onTertiaryContainer: MD3_COLORS.onSurface,
        } as AppMD3Colors,
        roundness: SHAPE_RADIUS.cornerMedium,
      } as AppMD3Theme,
      dark: {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,
          primary: MD3_COLORS_DARK.primary,
          onPrimary: MD3_COLORS_DARK.onPrimary,
          primaryContainer: MD3_COLORS_DARK.primaryContainer,
          onPrimaryContainer: MD3_COLORS_DARK.onPrimaryContainer,
          secondary: MD3_COLORS_DARK.secondary,
          secondaryContainer: MD3_COLORS_DARK.secondaryContainer,
          onSecondaryContainer: MD3_COLORS_DARK.onSecondaryContainer,
          tertiary: MD3_COLORS_DARK.tertiary,
          tertiaryContainer: MD3_COLORS_DARK.tertiaryContainer,
          error: MD3_COLORS_DARK.error,
          errorContainer: MD3_COLORS_DARK.errorContainer,
          surface: MD3_COLORS_DARK.surface,
          surfaceVariant: MD3_COLORS_DARK.surfaceVariant,
          onSurface: MD3_COLORS_DARK.onSurface,
          onSurfaceVariant: MD3_COLORS_DARK.onSurfaceVariant,
          outline: MD3_COLORS_DARK.outline,
          outlineVariant: MD3_COLORS_DARK.outlineVariant,
          inverseSurface: MD3_COLORS_DARK.inverseSurface,
          inverseOnSurface: MD3_COLORS_DARK.inverseOnSurface,
          inversePrimary: MD3_COLORS_DARK.inversePrimary,
          surfaceDim: MD3_COLORS_DARK.surfaceDim,
          surfaceBright: MD3_COLORS_DARK.surfaceBright,
          surfaceContainerLowest: MD3_COLORS_DARK.surfaceContainerLowest,
          surfaceContainerLow: MD3_COLORS_DARK.surfaceContainerLow,
          surfaceContainer: MD3_COLORS_DARK.surfaceContainer,
          surfaceContainerHigh: MD3_COLORS_DARK.surfaceContainerHigh,
          surfaceContainerHighest: MD3_COLORS_DARK.surfaceContainerHighest,
          primaryFixed: MD3_COLORS_DARK.primaryContainer,
          primaryFixedDim: MD3_COLORS_DARK.surface,
          onPrimaryFixed: MD3_COLORS_DARK.onPrimaryContainer,
          onPrimaryFixedVariant: MD3_COLORS_DARK.primary,
          scrim: MD3_COLORS_DARK.scrim,
          onErrorContainer: MD3_COLORS_DARK.error,
          onTertiaryContainer: MD3_COLORS_DARK.onSurface,
        } as AppMD3Colors,
        roundness: SHAPE_RADIUS.cornerMedium,
      } as AppMD3Theme,
    },
    mint: {
      light: {
        ...MD3LightTheme,
        colors: withExtendedColors({ ...MD3LightTheme.colors, primary: '#4CAF50', onPrimary: '#FFFFFF', primaryContainer: '#C8E6C9', onPrimaryContainer: '#1B5E20', secondary: '#81C784', secondaryContainer: '#E8F5E9', surface: '#F1F8F2', surfaceVariant: '#E8F5E9', onSurface: '#1B5E20', onSurfaceVariant: '#4CAF50', outline: '#81C784', outlineVariant: '#C8E6C9' }),
      },
      dark: {
        ...MD3DarkTheme,
        colors: withExtendedColors({ ...MD3DarkTheme.colors, primary: '#A5D6A7', onPrimary: '#1B5E20', primaryContainer: '#2E7D32', onPrimaryContainer: '#C8E6C9', secondary: '#81C784', secondaryContainer: '#2E7D32', surface: '#0F1F12', surfaceVariant: '#1B3A1F', onSurface: '#C8E6C9', onSurfaceVariant: '#81C784', outline: '#4CAF50', outlineVariant: '#2E7D32' }),
      },
    },
    sunset: {
      light: {
        ...MD3LightTheme,
        colors: withExtendedColors({ ...MD3LightTheme.colors, primary: '#FF7043', onPrimary: '#FFFFFF', primaryContainer: '#FFCCBC', onPrimaryContainer: '#BF360C', secondary: '#FFAB91', secondaryContainer: '#FBE9E7', surface: '#FFF8F6', surfaceVariant: '#FBE9E7', onSurface: '#BF360C', onSurfaceVariant: '#FF7043', outline: '#FFAB91', outlineVariant: '#FFCCBC' }),
      },
      dark: {
        ...MD3DarkTheme,
        colors: withExtendedColors({ ...MD3DarkTheme.colors, primary: '#FFAB91', onPrimary: '#BF360C', primaryContainer: '#E64A19', onPrimaryContainer: '#FFCCBC', secondary: '#FF7043', secondaryContainer: '#BF360C', surface: '#1F1210', surfaceVariant: '#3E2018', onSurface: '#FFCCBC', onSurfaceVariant: '#FFAB91', outline: '#FF7043', outlineVariant: '#E64A19' }),
      },
    },
    ocean: {
      light: {
        ...MD3LightTheme,
        colors: withExtendedColors({ ...MD3LightTheme.colors, primary: '#42A5F5', onPrimary: '#FFFFFF', primaryContainer: '#BBDEFB', onPrimaryContainer: '#0D47A1', secondary: '#90CAF9', secondaryContainer: '#E3F2FD', surface: '#F4F8FD', surfaceVariant: '#E3F2FD', onSurface: '#0D47A1', onSurfaceVariant: '#42A5F5', outline: '#90CAF9', outlineVariant: '#BBDEFB' }),
      },
      dark: {
        ...MD3DarkTheme,
        colors: withExtendedColors({ ...MD3DarkTheme.colors, primary: '#90CAF9', onPrimary: '#0D47A1', primaryContainer: '#1565C0', onPrimaryContainer: '#BBDEFB', secondary: '#42A5F5', secondaryContainer: '#1565C0', surface: '#0D1A28', surfaceVariant: '#1A3A5C', onSurface: '#BBDEFB', onSurfaceVariant: '#90CAF9', outline: '#42A5F5', outlineVariant: '#1565C0' }),
      },
    },
    forest: {
      light: {
        ...MD3LightTheme,
        colors: withExtendedColors({ ...MD3LightTheme.colors, primary: '#2E7D32', onPrimary: '#FFFFFF', primaryContainer: '#C8E6C9', onPrimaryContainer: '#1B5E20', secondary: '#66BB6A', secondaryContainer: '#E8F5E9', surface: '#F2F6F1', surfaceVariant: '#E8F5E9', onSurface: '#1B5E20', onSurfaceVariant: '#2E7D32', outline: '#66BB6A', outlineVariant: '#C8E6C9' }),
      },
      dark: {
        ...MD3DarkTheme,
        colors: withExtendedColors({ ...MD3DarkTheme.colors, primary: '#A5D6A7', onPrimary: '#1B5E20', primaryContainer: '#1B5E20', onPrimaryContainer: '#C8E6C9', secondary: '#66BB6A', secondaryContainer: '#1B5E20', surface: '#0F1A10', surfaceVariant: '#1B331D', onSurface: '#C8E6C9', onSurfaceVariant: '#66BB6A', outline: '#2E7D32', outlineVariant: '#1B5E20' }),
      },
    },
  };
}

const THEMES = buildThemes();

interface ThemeContextValue {
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
  md3Theme: AppMD3Theme;
  isDark: boolean;
  tokens: AppTokens;
  shape: typeof SHAPE_RADIUS;
  elevation: typeof ELEVATION;
  typography: typeof TYPOGRAPHY;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}

export function useMd3Theme(): AppMD3Theme {
  return useAppTheme().md3Theme;
}

export function useTypography() {
  return useAppTheme().typography;
}

export function ThemeProvider({
  themeName,
  setThemeName,
  children,
}: {
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
  children: React.ReactNode;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const md3Theme = useMemo(() => THEMES[themeName][isDark ? 'dark' : 'light'], [themeName, isDark]);

  const tokens = useMemo<AppTokens>(() => {
    const colors = isDark ? MD3_COLORS_DARK : MD3_COLORS;
    return {
      surfaceVariant: colors.surfaceVariant,
      onSurfaceVariant: colors.onSurfaceVariant,
      outline: colors.outline,
      outlineVariant: colors.outlineVariant,
      fabBackground: isDark ? MD3_COLORS_DARK.primaryContainer : MD3_COLORS.primaryContainer,
      fabForeground: isDark ? MD3_COLORS_DARK.onPrimaryContainer : MD3_COLORS.onPrimaryContainer,
      cardElevated: isDark ? MD3_COLORS_DARK.surfaceContainerHigh : MD3_COLORS.surfaceContainerLow,
      badgeBackground: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(45,80,22,0.1)',
      badgeForeground: isDark ? MD3_COLORS_DARK.onSurface : MD3_COLORS.onSurface,
      ripple: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(45,80,22,0.1)',
      inverseSurface: colors.inverseSurface,
      inverseOnSurface: colors.inverseOnSurface,
      inversePrimary: colors.inversePrimary,
      scrim: colors.scrim,
    };
  }, [isDark]);

  const value = useMemo<ThemeContextValue>(
    () => ({ themeName, setThemeName, md3Theme, isDark, tokens, shape: SHAPE_RADIUS, elevation: ELEVATION, typography: TYPOGRAPHY }),
    [themeName, setThemeName, md3Theme, isDark, tokens],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export { SHAPE_RADIUS, ELEVATION, TYPOGRAPHY };
