jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function LinearGradient(props) {
    return React.createElement(View, props, props.children);
  };
});

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');

  const chainableGesture = {
    onEnd: () => chainableGesture,
    runOnJS: () => chainableGesture,
  };

  return {
    GestureHandlerRootView: View,
    GestureDetector: ({ children }) => children,
    Gesture: {
      Pinch: () => chainableGesture,
    },
  };
});

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-mmkv', () => ({
  MMKV: class MockMMKV {
    constructor() {
      this.store = new Map();
    }

    getString(key) {
      return this.store.get(key) ?? null;
    }

    set(key, value) {
      this.store.set(key, value);
    }
  },
}));

jest.mock('./src/navigation', () => ({
  RootNavigator: () => null,
}));

jest.mock('./src/hooks/useAppInit', () => ({
  useAppInit: () => true,
}));
