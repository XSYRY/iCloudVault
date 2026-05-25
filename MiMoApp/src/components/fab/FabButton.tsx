import React, { useCallback } from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useMd3Theme } from '../../theme';
import { LineIcon } from '../shared/LineIcon';

interface FabButtonProps {
  iconName: string;
  label: string;
  onPress: () => void;
  showLabel?: boolean;
}

const SPRING_PRESS = { damping: 12, stiffness: 200, mass: 0.6 };

export function FabButton({ iconName, label, onPress, showLabel = true }: FabButtonProps) {
  const theme = useMd3Theme();
  const btnScale = useSharedValue(1);
  const labelScale = useSharedValue(1);

  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const labelAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: labelScale.value }],
  }));

  const handlePressIn = useCallback(() => {
    btnScale.value = withSpring(0.9, SPRING_PRESS);
    labelScale.value = withSpring(0.92, SPRING_PRESS);
  }, []);

  const handlePressOut = useCallback(() => {
    btnScale.value = withSpring(1, SPRING_PRESS);
    labelScale.value = withSpring(1, SPRING_PRESS);
  }, []);

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {showLabel && (
        <Animated.View style={[styles.labelPill, { backgroundColor: theme.colors.surfaceVariant }, labelAnimStyle]}>
          <Text style={[styles.labelText, { color: theme.colors.onSurfaceVariant }]}>
            {label}
          </Text>
        </Animated.View>
      )}
      <Animated.View style={[styles.btn, { backgroundColor: theme.colors.surfaceVariant }, btnAnimStyle]}>
        <LineIcon name={iconName} size={20} color={theme.colors.primary} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  labelPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
