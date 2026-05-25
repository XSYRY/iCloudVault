import React, { useCallback } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useAppTheme } from '../../theme';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

const SPRING_PRESS = { damping: 12, stiffness: 220, mass: 0.5 };

export function FilterChip({ label, selected, onToggle }: FilterChipProps) {
  const { md3Theme: theme, tokens } = useAppTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, SPRING_PRESS);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_PRESS);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.chip,
          {
            backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surfaceContainerLowest,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: selected ? 0.06 : 0.03,
            shadowRadius: 12,
            elevation: selected ? 3 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 0,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 13, fontWeight: '500' },
});
