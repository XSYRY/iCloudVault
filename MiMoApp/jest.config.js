module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-linear-gradient|react-native-safe-area-context|react-native-gesture-handler|react-native-reanimated)/)',
  ],
};
