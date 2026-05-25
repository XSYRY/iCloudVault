const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    minifierPath: require.resolve('metro-minify-terser'),
    minifierConfig: {
      compress: {
        keep_fnames: false,
        keep_classnames: false,
        passes: 3,
      },
      mangle: {
        keep_fnames: false,
        keep_classnames: false,
      },
    },
  },
  resolver: {
    extraNodeModules: new Proxy(
      {},
      {
        get: (target, name) => path.join(__dirname, 'node_modules', name),
      }
    ),
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName.startsWith('@/')) {
        return {
          filePath: path.resolve(__dirname, 'src', moduleName.slice(2)),
          type: 'sourceFile',
        };
      }
      if (moduleName === 'react-native-amap3d') {
        return {
          filePath: path.resolve(
            __dirname,
            'node_modules/react-native-amap3d/lib/src/index.ts',
          ),
          type: 'sourceFile',
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
  watchFolders: [path.resolve(__dirname, 'src')],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
