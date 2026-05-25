import React, { lazy, Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSettingsStore } from '../store';
import type { RootStackParamList } from '../types';

import { TabNavigator } from './TabNavigator';
import { LockScreen } from '../screens/LockScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';

const LightboxScreen = lazy(() => import('../screens/LightboxScreen').then(m => ({ default: m.LightboxScreen })));
const PhotoDetailScreen = lazy(() => import('../screens/PhotoDetailScreen').then(m => ({ default: m.PhotoDetailScreen })));
const SettingsScreen = lazy(() => import('../screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const AlbumDetailScreen = lazy(() => import('../screens/AlbumDetailScreen').then(m => ({ default: m.AlbumDetailScreen })));
const EditPanelScreen = lazy(() => import('../screens/EditPanelScreen').then(m => ({ default: m.EditPanelScreen })));
const PeopleScreen = lazy(() => import('../screens/PeopleScreen').then(m => ({ default: m.PeopleScreen })));
const HiddenScreen = lazy(() => import('../screens/HiddenScreen').then(m => ({ default: m.HiddenScreen })));
const FavoritesScreen = lazy(() => import('../screens/FavoritesScreen').then(m => ({ default: m.FavoritesScreen })));
const AlbumsScreen = lazy(() => import('../screens/AlbumsScreen').then(m => ({ default: m.AlbumsScreen })));
const SlideshowScreen = lazy(() => import('../screens/SlideshowScreen').then(m => ({ default: m.SlideshowScreen })));
const CollageScreen = lazy(() => import('../screens/CollageScreen').then(m => ({ default: m.CollageScreen })));
const VersionHistoryScreen = lazy(() => import('../screens/VersionHistoryScreen').then(m => ({ default: m.VersionHistoryScreen })));
const StorageDashboardScreen = lazy(() => import('../screens/StorageDashboardScreen').then(m => ({ default: m.StorageDashboardScreen })));
const SearchResultsScreen = lazy(() => import('../screens/SearchResultsScreen').then(m => ({ default: m.SearchResultsScreen })));
const CompareScreen = lazy(() => import('../screens/CompareScreen').then(m => ({ default: m.CompareScreen })));
const FaceGroupDetailScreen = lazy(() => import('../screens/FaceGroupDetailScreen').then(m => ({ default: m.FaceGroupDetailScreen })));
const LocationMomentsScreen = lazy(() => import('../screens/LocationMomentsScreen').then(m => ({ default: m.LocationMomentsScreen })));
const StoryViewerScreen = lazy(() => import('../screens/StoryViewerScreen').then(m => ({ default: m.StoryViewerScreen })));
const TagsScreen = lazy(() => import('../screens/TagsScreen').then(m => ({ default: m.TagsScreen })));
const VideoPlayerScreen = lazy(() => import('../screens/VideoPlayerScreen').then(m => ({ default: m.VideoPlayerScreen })));
const LivePhotoScreen = lazy(() => import('../screens/LivePhotoScreen').then(m => ({ default: m.LivePhotoScreen })));
const SearchScreen = lazy(() => import('../screens/SearchScreen').then(m => ({ default: m.SearchScreen })));

const LazyScreen = ({ component: Component, ...props }: { component: React.LazyExoticComponent<React.ComponentType<any>>; [key: string]: any }) => (
  <Suspense fallback={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F6F3' }}><ActivityIndicator size="large" color="#2C3E35" /></View>}>
    <Component {...props} />
  </Suspense>
);

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const pinEnabled = useSettingsStore((s) => s.pinEnabled);
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);

  const initialRoute = !onboardingComplete
    ? 'Onboarding'
    : pinEnabled
      ? 'Lock'
      : 'Main';

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="Lock" component={LockScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />

      <Stack.Screen name="Main" component={TabNavigator} />

      <Stack.Screen name="Lightbox" children={(props) => <LazyScreen component={LightboxScreen} {...props} />} options={{ animation: 'fade', gestureEnabled: true, gestureDirection: 'vertical' }} />
      <Stack.Screen name="PhotoDetail" children={(props) => <LazyScreen component={PhotoDetailScreen} {...props} />} options={{ animation: 'fade', gestureEnabled: true, gestureDirection: 'vertical' }} />
      <Stack.Screen name="EditPanel" children={(props) => <LazyScreen component={EditPanelScreen} {...props} />} options={{ animation: 'slide_from_bottom', gestureEnabled: true, gestureDirection: 'vertical' }} />
      <Stack.Screen name="AlbumDetail" children={(props) => <LazyScreen component={AlbumDetailScreen} {...props} />} />
      <Stack.Screen name="Settings" children={(props) => <LazyScreen component={SettingsScreen} {...props} />} />
      <Stack.Screen name="People" children={(props) => <LazyScreen component={PeopleScreen} {...props} />} />
      <Stack.Screen name="Hidden" children={(props) => <LazyScreen component={HiddenScreen} {...props} />} />
      <Stack.Screen name="Favorites" children={(props) => <LazyScreen component={FavoritesScreen} {...props} />} />
      <Stack.Screen name="Albums" children={(props) => <LazyScreen component={AlbumsScreen} {...props} />} />
      <Stack.Screen name="Slideshow" children={(props) => <LazyScreen component={SlideshowScreen} {...props} />} options={{ animation: 'fade' }} />
      <Stack.Screen name="Collage" children={(props) => <LazyScreen component={CollageScreen} {...props} />} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="VersionHistory" children={(props) => <LazyScreen component={VersionHistoryScreen} {...props} />} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="StorageDashboard" children={(props) => <LazyScreen component={StorageDashboardScreen} {...props} />} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="SearchResults" children={(props) => <LazyScreen component={SearchResultsScreen} {...props} />} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Compare" children={(props) => <LazyScreen component={CompareScreen} {...props} />} options={{ animation: 'fade' }} />
      <Stack.Screen name="FaceGroupDetail" children={(props) => <LazyScreen component={FaceGroupDetailScreen} {...props} />} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="LocationMoments" children={(props) => <LazyScreen component={LocationMomentsScreen} {...props} />} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="StoryViewer" children={(props) => <LazyScreen component={StoryViewerScreen} {...props} />} options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="Tags" children={(props) => <LazyScreen component={TagsScreen} {...props} />} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="VideoPlayer" children={(props) => <LazyScreen component={VideoPlayerScreen} {...props} />} options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="LivePhoto" children={(props) => <LazyScreen component={LivePhotoScreen} {...props} />} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Search" children={(props) => <LazyScreen component={SearchScreen} {...props} />} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}
