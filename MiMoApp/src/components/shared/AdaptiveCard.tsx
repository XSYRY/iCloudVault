import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';
import { useMd3Theme } from '../../theme';

interface AdaptiveCardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  elevated?: boolean;
}

export function AdaptiveCard({
  children,
  style,
  onPress,
  elevated = false
}: AdaptiveCardProps) {
  const theme = useMd3Theme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const backgroundColor = elevated
    ? theme.colors.surfaceContainerHigh
    : theme.colors.surfaceContainer;

  const shadowStyle = elevated ? {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 0,
  } : {};

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15 });
    }
  };

  const cardContent = (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor },
        shadowStyle,
        style
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={animatedStyle}>
          {cardContent}
        </Animated.View>
      </Pressable>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 0,
    padding: 20,
    overflow: 'hidden',
  },
});
