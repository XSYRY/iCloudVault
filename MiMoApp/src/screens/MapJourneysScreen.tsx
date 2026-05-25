import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  StatusBar,
  Platform,
  ScrollView,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AMapSdk, MapType, MapView, Marker } from 'react-native-amap3d';
import { EmptyState } from '../components/shared/EmptyState';
import { LineIcon } from '../components/shared/LineIcon';
import { usePhotosGroupedByLocation } from '../hooks/usePhotos';
import type { TabScreenProps } from '../navigation/types';
import { getGridClusterService } from '../services/mapClustering';
import { useUiStore } from '../store/uiStore';
import { useMd3Theme } from '../theme';
import type { Photo } from '../types';

AMapSdk.init(
  Platform.select({
    android: 'e8690c45e871eb49f534adcf7e1b2dd7',
    ios: 'YOUR_AMAP_IOS_KEY',
  }),
);

type SortMode = 'recent' | 'count' | 'name';
type LocationGroup = ReturnType<typeof usePhotosGroupedByLocation>[number];

interface LocationSummary extends LocationGroup {
  id: string;
  photoCount: number;
  latestTimestamp: number;
  latestPhoto: Photo;
  previewUris: string[];
  dateLabel: string;
  searchText: string;
  memoCount: number;
  latestMemo: string | null;
}

interface ClusterMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  isCluster: boolean;
  locations: LocationSummary[];
}

const SORT_OPTIONS: Array<{ key: SortMode; label: string; icon: string }> = [
  { key: 'recent', label: '最近', icon: 'clock' },
  { key: 'count', label: '照片多', icon: 'sort-count' },
  { key: 'name', label: 'A-Z', icon: 'sort-name' },
];

const DEFAULT_CAMERA = {
  target: { latitude: 35.8617, longitude: 104.1954 },
  zoom: 4,
};

const DRAWER_SPRING = { damping: 22, stiffness: 240, mass: 0.82 };
const COLLAPSED_PREVIEW_HEIGHT = 68;

function clamp01(value: number) {
  'worklet';
  return Math.max(0, Math.min(1, value));
}

function formatDate(dateTaken: string) {
  return dateTaken.replace(/-/g, '.');
}

function formatDateRange(earliest: string, latest: string) {
  if (earliest === latest) return formatDate(latest);
  const [startYear, startMonth, startDay] = earliest.split('-');
  const [endYear, endMonth, endDay] = latest.split('-');
  if (startYear === endYear) {
    return `${startMonth}.${startDay} - ${endMonth}.${endDay}`;
  }
  return `${formatDate(earliest)} - ${formatDate(latest)}`;
}

function estimateLatitudeDelta(zoomLevel: number) {
  return 360 / Math.pow(2, zoomLevel);
}

function getFocusTarget(latitude: number, longitude: number, zoomLevel: number) {
  const latitudeOffset = estimateLatitudeDelta(zoomLevel) * 0.1;
  return {
    latitude: latitude - latitudeOffset,
    longitude,
  };
}

function buildLocationSummary(group: LocationGroup, index: number): LocationSummary {
  const sortedItems = group.items.slice().sort((a, b) => b.createdAt - a.createdAt);
  const latestPhoto = sortedItems[0];
  const earliestPhoto = sortedItems[sortedItems.length - 1];
  const memoItems = sortedItems.filter((item) => item.memo?.trim());

  return {
    ...group,
    id: `${group.location}-${group.latitude}-${group.longitude}-${index}`,
    photoCount: group.items.length,
    latestTimestamp: latestPhoto.createdAt,
    latestPhoto,
    previewUris: sortedItems.slice(0, 3).map((item) => item.thumbnailUri ?? item.uri),
    dateLabel: formatDateRange(earliestPhoto.dateTaken, latestPhoto.dateTaken),
    searchText: `${group.location} ${latestPhoto.filename} ${memoItems
      .map((item) => item.memo)
      .join(' ')}`.toLowerCase(),
    memoCount: memoItems.length,
    latestMemo: memoItems[0]?.memo?.trim() ?? null,
  };
}

function previewText(text: string | null, max = 46) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function getClusterMarkerScale(count: number) {
  if (count >= 24) return 58;
  if (count >= 10) return 50;
  return 42;
}

function PreviewStrip({
  uris,
  photoCount,
}: {
  uris: string[];
  photoCount: number;
}) {
  return (
    <View style={styles.previewStrip}>
      {uris.slice(0, 3).map((uri, index) => (
        <Image
          key={`${uri}-${index}`}
          source={{ uri }}
          style={[styles.previewImage, index > 0 && styles.previewImageOverlap]}
        />
      ))}
      {photoCount > 3 ? (
        <View style={styles.previewCountBadge}>
          <Text style={styles.previewCountText}>+{photoCount - 3}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function MapJourneysScreen({ navigation }: TabScreenProps<'MapJourneysTab'>) {
  const theme = useMd3Theme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const mapRef = useRef<any>(null);
  const rawLocations = usePhotosGroupedByLocation();
  const mapPreviewPin = useUiStore((s) => s.mapPreviewPin);
  const mapPreviewPinDropPoint = useUiStore((s) => s.mapPreviewPinDropPoint);
  const setMapPreviewPin = useUiStore((s) => s.setMapPreviewPin);
  const clearMapPreviewPinDropPoint = useUiStore((s) => s.clearMapPreviewPinDropPoint);
  const setTabBarHidden = useUiStore((s) => s.setTabBarHidden);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [zoomLevel, setZoomLevel] = useState(5);
  const [drawerStaticContentHeight, setDrawerStaticContentHeight] = useState(0);
  const [drawerChromeHeight, setDrawerChromeHeight] = useState(0);
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  const [idlePreviewLocationId, setIdlePreviewLocationId] = useState<string | null>(null);

  const drawerProgress = useSharedValue(0);
  const drawerStartProgress = useSharedValue(0);

  useEffect(() => {
    setTabBarHidden(false);
  }, [setTabBarHidden]);

  useFocusEffect(
    useCallback(() => {
      drawerProgress.value = withSpring(0, DRAWER_SPRING);
      setDrawerExpanded(false);
    }, [drawerProgress]),
  );

  const locations = useMemo(
    () => rawLocations.map((group, index) => buildLocationSummary(group, index)),
    [rawLocations],
  );

  const totalPhotoCount = useMemo(
    () => locations.reduce((sum, location) => sum + location.photoCount, 0),
    [locations],
  );

  const totalMemoCount = useMemo(
    () => locations.reduce((sum, location) => sum + location.memoCount, 0),
    [locations],
  );

  const filteredLocations = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const next = locations.slice();

    const searched = keyword
      ? next.filter((location) => location.searchText.includes(keyword))
      : next;

    searched.sort((a, b) => {
      switch (sortMode) {
        case 'count':
          return b.photoCount - a.photoCount || b.latestTimestamp - a.latestTimestamp;
        case 'name':
          return a.location.localeCompare(b.location, 'zh-Hans-CN');
        default:
          return b.latestTimestamp - a.latestTimestamp;
      }
    });

    return searched;
  }, [locations, searchQuery, sortMode]);

  const selectedLocation = useMemo(
    () => filteredLocations.find((item) => item.id === selectedLocationId) ?? null,
    [filteredLocations, selectedLocationId],
  );

  const initialCamera = useMemo(() => {
    if (locations.length === 0) return DEFAULT_CAMERA;
    if (locations.length === 1) {
      return {
        target: {
          latitude: locations[0].latitude,
          longitude: locations[0].longitude,
        },
        zoom: 8.8,
      };
    }

    const avgLat =
      locations.reduce((sum, location) => sum + location.latitude, 0) / locations.length;
    const avgLng =
      locations.reduce((sum, location) => sum + location.longitude, 0) / locations.length;

    return {
      target: { latitude: avgLat, longitude: avgLng },
      zoom: locations.length > 20 ? 4.4 : 5.2,
    };
  }, [locations]);

  useEffect(() => {
    if (filteredLocations.length === 0) {
      setSelectedLocationId(null);
      setIdlePreviewLocationId(null);
      return;
    }

    if (
      !selectedLocationId ||
      !filteredLocations.some((item) => item.id === selectedLocationId)
    ) {
      setSelectedLocationId(filteredLocations[0].id);
    }
  }, [filteredLocations, selectedLocationId]);

  useEffect(() => {
    if (drawerExpanded || filteredLocations.length === 0) {
      setIdlePreviewLocationId(null);
      return;
    }

    const candidates = filteredLocations.some((item) => item.latestMemo)
      ? filteredLocations.filter((item) => item.latestMemo)
      : filteredLocations;

    if (candidates.length === 1) {
      setIdlePreviewLocationId(candidates[0].id);
      return;
    }

    const pickNextId = (currentId: string | null) => {
      const pool = candidates.filter((item) => item.id !== currentId);
      const next = pool[Math.floor(Math.random() * pool.length)] ?? candidates[0];
      return next.id;
    };

    setIdlePreviewLocationId((currentId) => currentId ?? pickNextId(null));

    const timer = setInterval(() => {
      setIdlePreviewLocationId((currentId) => pickNextId(currentId));
    }, 4200);

    return () => clearInterval(timer);
  }, [drawerExpanded, filteredLocations]);

  const drawerBodyMaxHeight = useMemo(() => {
    const topOffset = insets.top + 8;
    const tabBarReservedSpace = insets.bottom + 68;
    const expandedChromeHeight = Math.max(82, drawerChromeHeight - COLLAPSED_PREVIEW_HEIGHT);
    return Math.max(
      windowHeight - topOffset - expandedChromeHeight - tabBarReservedSpace,
      360,
    );
  }, [drawerChromeHeight, insets.bottom, insets.top, windowHeight]);

  const drawerTravelDistance = useMemo(
    () => Math.max(1, drawerBodyMaxHeight - COLLAPSED_PREVIEW_HEIGHT),
    [drawerBodyMaxHeight],
  );

  const openLocationMoments = useCallback(
    (location: LocationSummary) => {
      navigation.navigate('LocationMoments', {
        location: location.location,
        photoIds: location.items.map((item) => item.id),
        initialPhotoId: location.latestPhoto.id,
      });
    },
    [navigation],
  );

  const openLocationPhotos = useCallback(
    (location: LocationSummary) => {
      navigation.navigate('Lightbox', {
        photoId: location.latestPhoto.id,
        photoIds: location.items.map((item) => item.id),
      });
    },
    [navigation],
  );

  const collapseDrawer = useCallback(() => {
    drawerProgress.value = withSpring(0, DRAWER_SPRING);
    setDrawerExpanded(false);
  }, [drawerProgress]);

  const toggleDrawer = useCallback(() => {
    const nextExpanded = !(drawerProgress.value > 0.5);
    drawerProgress.value = withSpring(nextExpanded ? 1 : 0, DRAWER_SPRING);
    setDrawerExpanded(nextExpanded);
  }, [drawerProgress]);

  const focusLocation = useCallback((location: LocationSummary, nextZoom = 8.8) => {
    setSelectedLocationId(location.id);
    const target = getFocusTarget(location.latitude, location.longitude, nextZoom);
    mapRef.current?.moveCamera({ target, zoom: nextZoom }, 320);
  }, []);

  const clusterMarkers = useMemo<ClusterMarkerData[]>(() => {
    if (filteredLocations.length === 0) return [];

    if (zoomLevel >= 9 || filteredLocations.length <= 8) {
      return filteredLocations.map((location) => ({
        id: location.id,
        latitude: location.latitude,
        longitude: location.longitude,
        count: location.photoCount,
        isCluster: false,
        locations: [location],
      }));
    }

    const clusterService = getGridClusterService();
    const clustered = clusterService.cluster(
      filteredLocations.map((location) => ({
        id: location.id,
        photoId: location.latestPhoto.id,
        point: { latitude: location.latitude, longitude: location.longitude },
      })),
      zoomLevel,
      {
        latitudeDelta: estimateLatitudeDelta(zoomLevel),
        longitudeDelta: estimateLatitudeDelta(zoomLevel),
      },
    );

    return clustered.map((cluster) => {
      const clusterLocations = cluster.itemIds
        .map((id) => filteredLocations.find((location) => location.id === id))
        .filter(Boolean) as LocationSummary[];

      if (clusterLocations.length === 1) {
        const [location] = clusterLocations;
        return {
          id: location.id,
          latitude: location.latitude,
          longitude: location.longitude,
          count: location.photoCount,
          isCluster: false,
          locations: [location],
        };
      }

      return {
        id: cluster.id,
        latitude: cluster.point.latitude,
        longitude: cluster.point.longitude,
        count: clusterLocations.reduce((sum, location) => sum + location.photoCount, 0),
        isCluster: true,
        locations: clusterLocations,
      };
    });
  }, [filteredLocations, zoomLevel]);

  const handleMarkerPress = useCallback(
    (marker: ClusterMarkerData) => {
      if (marker.isCluster) {
        const nextZoom = Math.min(zoomLevel + 1.2, 9.6);
        const target = getFocusTarget(marker.latitude, marker.longitude, nextZoom);
        mapRef.current?.moveCamera({ target, zoom: nextZoom }, 260);
        return;
      }

      const location = marker.locations[0];
      focusLocation(location, Math.max(zoomLevel, 8.6));
      collapseDrawer();
    },
    [collapseDrawer, focusLocation, zoomLevel],
  );

  const handleCameraIdle = useCallback((event: any) => {
    const nextZoom =
      event?.nativeEvent?.zoomLevel ??
      event?.nativeEvent?.zoom ??
      event?.zoomLevel ??
      event?.zoom;

    if (typeof nextZoom === 'number' && Number.isFinite(nextZoom)) {
      setZoomLevel(nextZoom);
    }
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapPreviewPinDropPoint) return;

    let cancelled = false;

    const syncPreviewPin = async () => {
      try {
        const latLng = await mapRef.current?.getLatLng({
          x: mapPreviewPinDropPoint.x,
          y: mapPreviewPinDropPoint.y,
        });

        if (!cancelled && latLng?.latitude && latLng?.longitude) {
          setMapPreviewPin({
            latitude: latLng.latitude,
            longitude: latLng.longitude,
          });
        }
      } finally {
        if (!cancelled) {
          clearMapPreviewPinDropPoint();
        }
      }
    };

    syncPreviewPin();

    return () => {
      cancelled = true;
    };
  }, [
    clearMapPreviewPinDropPoint,
    mapLoaded,
    mapPreviewPinDropPoint,
    setMapPreviewPin,
  ]);

  const drawerGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .shouldCancelWhenOutside(false)
        .onStart(() => {
          drawerStartProgress.value = drawerProgress.value;
        })
        .onUpdate((event) => {
          const next = drawerStartProgress.value + event.translationY / drawerTravelDistance;
          drawerProgress.value = clamp01(next);
        })
        .onEnd((event) => {
          if (event.velocityY <= -180) {
            drawerProgress.value = withSpring(0, DRAWER_SPRING);
            runOnJS(setDrawerExpanded)(false);
            return;
          }
          if (event.velocityY >= 180) {
            drawerProgress.value = withSpring(1, DRAWER_SPRING);
            runOnJS(setDrawerExpanded)(true);
            return;
          }
          if (drawerProgress.value < 0.04) {
            drawerProgress.value = withSpring(0, DRAWER_SPRING);
            runOnJS(setDrawerExpanded)(false);
          }
          if (drawerProgress.value > 0.96) {
            drawerProgress.value = withSpring(1, DRAWER_SPRING);
            runOnJS(setDrawerExpanded)(true);
          }
        }),
    [drawerProgress, drawerStartProgress, drawerTravelDistance],
  );

  const drawerBodyAnimatedStyle = useAnimatedStyle(() => ({
    height: drawerBodyMaxHeight * drawerProgress.value,
    opacity: drawerProgress.value,
  }));

  const drawerBodyContentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, drawerProgress.value * 1.15),
    transform: [{ translateY: (1 - drawerProgress.value) * -12 }],
  }));

  const collapsedPreviewAnimatedStyle = useAnimatedStyle(() => ({
    height: COLLAPSED_PREVIEW_HEIGHT * (1 - drawerProgress.value),
    opacity: 1 - drawerProgress.value,
  }));

  const chevronAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${drawerProgress.value * 180}deg` }],
  }));

  const locationListViewportAnimatedStyle = useAnimatedStyle(() => {
    const availableHeight =
      drawerBodyMaxHeight * drawerProgress.value - drawerStaticContentHeight - 12;

    return {
      height: Math.max(0, availableHeight),
      opacity: drawerProgress.value > 0.12 ? 1 : drawerProgress.value / 0.12,
    };
  }, [drawerBodyMaxHeight, drawerStaticContentHeight]);

  if (locations.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={{ height: insets.top + 12 }} />
        <EmptyState
          icon="map"
          title="还没有足迹"
          subtitle="等照片带上位置信息后，这里会自动整理出你去过的地点。"
        />
      </View>
    );
  }

  const panelTitle = selectedLocation ? selectedLocation.location : '足迹地图';
  const panelSubtitle = selectedLocation
    ? `${selectedLocation.photoCount} 张照片 · ${selectedLocation.memoCount} 条随记`
    : `${filteredLocations.length} 个地点 · ${totalMemoCount} 条随记`;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        mapType={MapType.Standard}
        initialCameraPosition={initialCamera}
        buildingsEnabled={false}
        labelsEnabled
        trafficEnabled={false}
        compassEnabled
        scaleControlsEnabled
        zoomControlsEnabled={false}
        onLoad={() => setMapLoaded(true)}
        onCameraIdle={handleCameraIdle}
      >
        {mapLoaded &&
          clusterMarkers.map((marker) => {
            const isSelected =
              !marker.isCluster && marker.locations[0]?.id === selectedLocation?.id;
            const markerSize = getClusterMarkerScale(marker.count);

            return (
              <Marker
                key={marker.id}
                position={{ latitude: marker.latitude, longitude: marker.longitude }}
                onPress={() => handleMarkerPress(marker)}
              >
                <View style={styles.markerWrap}>
                  <View
                    style={[
                      styles.markerBubble,
                      {
                        width: markerSize,
                        height: markerSize,
                        borderRadius: markerSize / 2,
                        backgroundColor: marker.isCluster
                          ? theme.colors.primary
                          : theme.colors.surface,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.surfaceContainerHighest,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.markerCount,
                        {
                          color: marker.isCluster
                            ? theme.colors.onPrimary
                            : theme.colors.onSurface,
                        },
                      ]}
                    >
                      {marker.count}
                    </Text>
                  </View>
                  {marker.locations.some((location) => location.memoCount > 0) ? (
                    <View
                      style={[
                        styles.markerMemoDot,
                        { backgroundColor: theme.colors.tertiary },
                      ]}
                    />
                  ) : null}
                </View>
              </Marker>
            );
          })}

        {mapPreviewPin ? (
          <Marker
            position={mapPreviewPin}
            draggable
            anchor={{ x: 0.5, y: 1 }}
            zIndex={999}
            onDragEnd={(event: any) => setMapPreviewPin(event.nativeEvent)}
          >
            <View style={styles.previewPinMarker}>
              <View style={[styles.previewPinBadge, { backgroundColor: theme.colors.primary }]}>
                <LineIcon name="pin" size={16} color={theme.colors.onPrimary} />
              </View>
              <View
                style={[
                  styles.previewPinLabel,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Text
                  style={[styles.previewPinLabelText, { color: theme.colors.onSurface }]}
                >
                  想去
                </Text>
              </View>
            </View>
          </Marker>
        ) : null}
      </MapView>

      {!mapLoaded ? (
        <View
          style={[
            styles.mapLoadingOverlay,
            { backgroundColor: theme.colors.surfaceContainerLow },
          ]}
        >
          <Text style={[styles.mapLoadingText, { color: theme.colors.onSurfaceVariant }]}>
            地图加载中...
          </Text>
        </View>
      ) : null}

      <Animated.View style={[styles.topDrawerWrap, { top: insets.top + 8 }]}>
        <GestureDetector gesture={drawerGesture}>
          <View
            style={[
              styles.topDrawer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View
              onLayout={(event) => {
                setDrawerChromeHeight(event.nativeEvent.layout.height);
              }}
            >
              <Pressable style={styles.drawerHeader} onPress={toggleDrawer}>
                <View style={styles.drawerHeaderText}>
                  <Text style={[styles.drawerTitle, { color: theme.colors.onSurface }]}>
                    {panelTitle}
                  </Text>
                  <Text
                    style={[styles.drawerSubtitle, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {panelSubtitle}
                  </Text>
                </View>

                <Animated.View
                  style={[
                    styles.drawerHeaderActions,
                    { backgroundColor: theme.colors.surfaceContainerLow },
                    chevronAnimatedStyle,
                  ]}
                >
                  <LineIcon name="chevron-down" size={18} color={theme.colors.onSurface} />
                </Animated.View>
              </Pressable>

              {selectedLocation ? (
                <Animated.View
                  style={[styles.collapsedPreviewWrap, collapsedPreviewAnimatedStyle]}
                >
                  <View style={styles.collapsedPreview}>
                    <PreviewStrip
                      uris={selectedLocation.previewUris}
                      photoCount={selectedLocation.photoCount}
                    />
                    <View style={styles.collapsedPreviewText}>
                      <Text
                        style={[
                          styles.collapsedPreviewMemo,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                        numberOfLines={2}
                      >
                        {selectedLocation.latestMemo
                          ? previewText(selectedLocation.latestMemo)
                          : '往下拉开这里，就能更顺手地浏览地点和进入随记。'}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ) : null}
            </View>

            <Animated.View style={[styles.drawerBodyWrap, drawerBodyAnimatedStyle]}>
            <Animated.View style={[styles.drawerBody, drawerBodyContentAnimatedStyle]}>
              <View
                onLayout={(event) => {
                  setDrawerStaticContentHeight(event.nativeEvent.layout.height);
                }}
              >
                <View
                  style={[
                    styles.searchBar,
                    {
                      backgroundColor: theme.colors.surfaceContainerLow,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <LineIcon name="search" size={18} color={theme.colors.onSurfaceVariant} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="搜索地点或随记"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    style={[styles.searchInput, { color: theme.colors.onSurface }]}
                  />
                  {searchQuery.length > 0 ? (
                    <Pressable onPress={() => setSearchQuery('')}>
                      <LineIcon name="close" size={16} color={theme.colors.onSurfaceVariant} />
                    </Pressable>
                  ) : null}
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.sortRow}
                >
                  {SORT_OPTIONS.map((option) => {
                    const active = option.key === sortMode;
                    return (
                      <Pressable
                        key={option.key}
                        style={[
                          styles.sortChip,
                          {
                            backgroundColor: active
                              ? theme.colors.primary
                              : theme.colors.surfaceContainerLow,
                            borderColor: active
                              ? theme.colors.primary
                              : theme.colors.outlineVariant,
                          },
                        ]}
                        onPress={() => setSortMode(option.key)}
                      >
                        <LineIcon
                          name={option.icon}
                          size={14}
                          color={active ? theme.colors.onPrimary : theme.colors.primary}
                        />
                        <Text
                          style={[
                            styles.sortChipText,
                            { color: active ? theme.colors.onPrimary : theme.colors.onSurface },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={styles.summaryRow}>
                  <View
                    style={[
                      styles.summaryCard,
                      { backgroundColor: theme.colors.surfaceContainerLow },
                    ]}
                  >
                    <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                      {filteredLocations.length}
                    </Text>
                    <Text
                      style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}
                    >
                      地点
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.summaryCard,
                      { backgroundColor: theme.colors.surfaceContainerLow },
                    ]}
                  >
                    <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                      {totalPhotoCount}
                    </Text>
                    <Text
                      style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}
                    >
                      照片
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.summaryCard,
                      { backgroundColor: theme.colors.surfaceContainerLow },
                    ]}
                  >
                    <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                      {totalMemoCount}
                    </Text>
                    <Text
                      style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}
                    >
                      随记
                    </Text>
                  </View>
                </View>
              </View>

              {filteredLocations.length === 0 ? (
                <View
                  style={[
                    styles.emptyFilterCard,
                    { backgroundColor: theme.colors.surfaceContainerLow },
                  ]}
                >
                  <LineIcon name="message" size={18} color={theme.colors.primary} />
                  <Text
                    style={[styles.emptyFilterText, { color: theme.colors.onSurfaceVariant }]}
                  >
                    没有匹配到这个关键词，换个地点名或随记内容试试。
                  </Text>
                </View>
              ) : (
                <Animated.View
                  style={[styles.locationListViewport, locationListViewportAnimatedStyle]}
                >
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.locationList}
                    contentContainerStyle={styles.locationListContent}
                  >
                    {filteredLocations.map((location) => {
                      const isSelected = location.id === selectedLocation?.id;
                      return (
                        <Pressable
                          key={location.id}
                          style={[
                            styles.locationCard,
                            {
                              backgroundColor: isSelected
                                ? theme.colors.primaryContainer
                                : theme.colors.surfaceContainerLow,
                              borderColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.outlineVariant,
                            },
                          ]}
                          onPress={() => {
                            setSelectedLocationId(location.id);
                            focusLocation(location);
                            collapseDrawer();
                          }}
                        >
                          <View style={styles.locationCardTop}>
                            <View style={styles.locationCopy}>
                              <Text
                                style={[styles.locationName, { color: theme.colors.onSurface }]}
                                numberOfLines={1}
                              >
                                {location.location}
                              </Text>
                              <Text
                                style={[
                                  styles.locationMeta,
                                  { color: theme.colors.onSurfaceVariant },
                                ]}
                              >
                                {location.dateLabel} · {location.photoCount} 张
                              </Text>
                            </View>
                            <PreviewStrip
                              uris={location.previewUris}
                              photoCount={location.photoCount}
                            />
                          </View>

                          <View
                            style={[
                              styles.locationMemoPreview,
                              { backgroundColor: theme.colors.surface },
                            ]}
                          >
                            <LineIcon name="message" size={14} color={theme.colors.primary} />
                            <Text
                              style={[
                                styles.locationMemoText,
                                { color: theme.colors.onSurfaceVariant },
                              ]}
                              numberOfLines={2}
                            >
                              {location.latestMemo
                                ? previewText(location.latestMemo, 78)
                                : '还没有随记，进去就能在同一页里看照片和写内容。'}
                            </Text>
                          </View>

                          <View style={styles.locationActions}>
                            <Pressable
                              style={[
                                styles.secondaryAction,
                                {
                                  backgroundColor: theme.colors.surface,
                                  borderColor: theme.colors.outlineVariant,
                                },
                              ]}
                              onPress={() => openLocationPhotos(location)}
                            >
                              <Text
                                style={[
                                  styles.secondaryActionText,
                                  { color: theme.colors.onSurface },
                                ]}
                              >
                                看照片
                              </Text>
                            </Pressable>
                            <Pressable
                              style={[
                                styles.primaryAction,
                                { backgroundColor: theme.colors.primary },
                              ]}
                              onPress={() => openLocationMoments(location)}
                            >
                              <Text
                                style={[
                                  styles.primaryActionText,
                                  { color: theme.colors.onPrimary },
                                ]}
                              >
                                进入随记页
                              </Text>
                            </Pressable>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </Animated.View>
              )}
            </Animated.View>
          </Animated.View>

            <Pressable style={styles.bottomHandleWrap} onPress={toggleDrawer}>
              <View
                style={[
                  styles.handlePill,
                  { backgroundColor: theme.colors.outlineVariant },
                ]}
              />
            </Pressable>
          </View>
        </GestureDetector>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  emptyContainer: { flex: 1 },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLoadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  topDrawerWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  topDrawer: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
  },
  drawerHeaderText: {
    flex: 1,
  },
  handlePill: {
    width: 44,
    height: 4,
    borderRadius: 999,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  drawerSubtitle: {
    marginTop: 4,
    fontSize: 11,
  },
  drawerHeaderActions: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedPreviewWrap: {
    overflow: 'hidden',
  },
  collapsedPreview: {
    minHeight: COLLAPSED_PREVIEW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  collapsedPreviewText: {
    flex: 1,
  },
  collapsedPreviewMemo: {
    fontSize: 12,
    lineHeight: 18,
  },
  drawerBodyWrap: {
    overflow: 'hidden',
  },
  drawerBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  bottomHandleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 10,
  },
  searchBar: {
    marginTop: 4,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    margin: 0,
  },
  sortRow: {
    gap: 10,
    paddingTop: 12,
    paddingBottom: 6,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  summaryLabel: {
    marginTop: 4,
    fontSize: 11,
  },
  emptyFilterCard: {
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  emptyFilterText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  locationListViewport: {
    marginTop: 12,
    overflow: 'hidden',
  },
  locationList: {
    height: '100%',
  },
  locationListContent: {
    paddingBottom: 6,
    gap: 10,
  },
  locationCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  locationCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationCopy: {
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '800',
  },
  locationMeta: {
    marginTop: 4,
    fontSize: 12,
  },
  locationMemoPreview: {
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  locationMemoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  secondaryAction: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  primaryAction: {
    flex: 1.1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  previewStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
  },
  previewImage: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#DDE8E0',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  previewImageOverlap: {
    marginLeft: -10,
  },
  previewCountBadge: {
    marginLeft: 8,
    borderRadius: 999,
    backgroundColor: '#2C3E35',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  previewCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  previewPinMarker: {
    alignItems: 'center',
  },
  previewPinBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
  previewPinLabel: {
    marginTop: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  previewPinLabelText: {
    fontSize: 11,
    fontWeight: '700',
  },
  markerWrap: {
    alignItems: 'center',
  },
  markerBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  markerCount: {
    fontSize: 13,
    fontWeight: '800',
  },
  markerMemoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
