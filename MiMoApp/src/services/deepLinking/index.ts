import { Linking } from 'react-native';
import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../../types';

type DeepLinkRoute = {
  screen: keyof RootStackParamList;
  params?: RootStackParamList[keyof RootStackParamList];
};

const LINK_PATTERNS: Array<{
  pattern: RegExp;
  map: (match: RegExpMatchArray) => DeepLinkRoute;
}> = [
  {
    pattern: /mimo:\/\/photo\/([^/]+)/,
    map: (m) => ({ screen: 'Lightbox', params: { photoId: m[1], photoIds: [m[1]] } }),
  },
  {
    pattern: /mimo:\/\/album\/([^/]+)/,
    map: (m) => ({ screen: 'AlbumDetail', params: { albumId: m[1] } }),
  },
  {
    pattern: /mimo:\/\/search\?q=(.+)/,
    map: (m) => ({ screen: 'SearchResults', params: { query: decodeURIComponent(m[1]) } }),
  },
  {
    pattern: /mimo:\/\/settings/,
    map: () => ({ screen: 'Settings' }),
  },
  {
    pattern: /mimo:\/\/people/,
    map: () => ({ screen: 'People' }),
  },
  {
    pattern: /mimo:\/\/map/,
    map: () => ({ screen: 'Main' }),
  },
];

export function parseDeepLink(url: string): DeepLinkRoute | null {
  for (const { pattern, map } of LINK_PATTERNS) {
    const match = url.match(pattern);
    if (match) return map(match);
  }
  return null;
}

export function setupDeepLinking(navigationRef: NavigationContainerRef<RootStackParamList>): () => void {
  const handleUrl = (url: string) => {
    const route = parseDeepLink(url);
    if (route) {
      navigationRef.navigate(route.screen as any, route.params as any);
    }
  };

  Linking.getInitialURL().then((url) => {
    if (url) handleUrl(url);
  });

  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleUrl(url);
  });

  return () => subscription.remove();
}
