import React from 'react';
import { View, Image, StyleSheet, useColorScheme } from 'react-native';

interface AdaptiveImageProps {
  source: {
    light?: string;
    dark?: string;
    default: string;
  };
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export function AdaptiveImage({ 
  source, 
  style,
  resizeMode = 'contain' 
}: AdaptiveImageProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const uri = isDark 
    ? (source.dark || source.default)
    : (source.light || source.default);

  return (
    <Image
      source={{ uri }}
      style={[styles.image, style]}
      resizeMode={resizeMode}
    />
  );
}

interface AdaptiveBackgroundProps {
  lightColor: string;
  darkColor: string;
  children?: React.ReactNode;
  style?: any;
}

export function AdaptiveBackground({
  lightColor,
  darkColor,
  children,
  style
}: AdaptiveBackgroundProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = isDark ? darkColor : lightColor;

  return (
    <View style={[styles.background, { backgroundColor }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  background: {
    flex: 1,
  },
});
