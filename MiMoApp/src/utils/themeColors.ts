import { useColorScheme, Appearance } from 'react-native';

export type ColorScheme = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  onSecondary: string;
  onSecondaryContainer: string;
  tertiary: string;
  tertiaryContainer: string;
  onTertiary: string;
  onTertiaryContainer: string;
  error: string;
  errorContainer: string;
  onError: string;
  onErrorContainer: string;
  surface: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  background: string;
  onBackground: string;
  card: string;
  text: string;
  textSecondary: string;
  divider: string;
  shadow: string;
  overlay: string;
  scrim: string;
  ripple: string;
}

export const lightThemeColors: ThemeColors = {
  primary: '#6750A4',
  primaryContainer: '#EADDFF',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#21005D',
  secondary: '#625B71',
  secondaryContainer: '#E8DEF8',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#1D192B',
  tertiary: '#7D5260',
  tertiaryContainer: '#FFD8E4',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#31111D',
  error: '#B3261E',
  errorContainer: '#F9DEDC',
  onError: '#FFFFFF',
  onErrorContainer: '#410E0B',
  surface: '#FFFBFE',
  surfaceDim: '#DED8E1',
  surfaceBright: '#FFFBFE',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F7F2FA',
  surfaceContainer: '#F3EDF7',
  surfaceContainerHigh: '#ECE6F0',
  surfaceContainerHighest: '#E6E0E9',
  surfaceVariant: '#E7E0EC',
  onSurface: '#1C1B1F',
  onSurfaceVariant: '#49454F',
  outline: '#79747E',
  outlineVariant: '#CAC4D0',
  inverseSurface: '#313033',
  inverseOnSurface: '#F4EFF4',
  inversePrimary: '#D0BCFF',
  background: '#FFFBFE',
  onBackground: '#1C1B1F',
  card: '#FFFFFF',
  text: '#1C1B1F',
  textSecondary: '#49454F',
  divider: '#CAC4D0',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  scrim: 'rgba(0, 0, 0, 0.32)',
  ripple: 'rgba(0, 0, 0, 0.1)',
};

export const darkThemeColors: ThemeColors = {
  primary: '#D0BCFF',
  primaryContainer: '#4F378B',
  onPrimary: '#381E72',
  onPrimaryContainer: '#EADDFF',
  secondary: '#CBC5D0',
  secondaryContainer: '#4A4553',
  onSecondary: '#332D41',
  onSecondaryContainer: '#E8DEF8',
  tertiary: '#EFB8C8',
  tertiaryContainer: '#633B48',
  onTertiary: '#492532',
  onTertiaryContainer: '#FFD8E4',
  error: '#F2B8B5',
  errorContainer: '#8C1D18',
  onError: '#601410',
  onErrorContainer: '#F9DEDC',
  surface: '#1C1B1F',
  surfaceDim: '#141218',
  surfaceBright: '#3B383E',
  surfaceContainerLowest: '#0F0D13',
  surfaceContainerLow: '#1D1B20',
  surfaceContainer: '#211F26',
  surfaceContainerHigh: '#2B2930',
  surfaceContainerHighest: '#36343B',
  surfaceVariant: '#49454F',
  onSurface: '#E6E1E5',
  onSurfaceVariant: '#CAC4D0',
  outline: '#938F99',
  outlineVariant: '#49454F',
  inverseSurface: '#E6E1E5',
  inverseOnSurface: '#313033',
  inversePrimary: '#6750A4',
  background: '#1C1B1F',
  onBackground: '#E6E1E5',
  card: '#2B2930',
  text: '#E6E1E5',
  textSecondary: '#CAC4D0',
  divider: '#49454F',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  scrim: 'rgba(0, 0, 0, 0.5)',
  ripple: 'rgba(255, 255, 255, 0.15)',
};

export function useThemeColors(scheme?: 'light' | 'dark'): ThemeColors {
  const systemScheme = useColorScheme();
  const isDark = scheme === 'dark' || (scheme !== 'light' && systemScheme === 'dark');
  return isDark ? darkThemeColors : lightThemeColors;
}

export function useIsDarkMode(scheme?: 'light' | 'dark'): boolean {
  const systemScheme = useColorScheme();
  return scheme === 'dark' || (scheme !== 'light' && systemScheme === 'dark');
}

export function getColorSchemePreference(): ColorScheme {
  return Appearance.getColorScheme() || 'system';
}

export function addColorSchemeListener(
  listener: (scheme: 'light' | 'dark') => void
): () => void {
  const subscription = Appearance.addChangeListener(({ colorScheme }) => {
    listener(colorScheme || 'light');
  });
  return () => subscription.remove();
}
