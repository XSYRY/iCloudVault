import React, { useMemo, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { MapView, Marker, MapType } from 'react-native-amap3d';
import { useMd3Theme } from '../theme';
import { usePhotosGroupedByLocation } from '../hooks/usePhotos';
import type { TabScreenProps } from '../navigation/types';
import { Toolbar } from '../components/shared/Toolbar';
import { EmptyState } from '../components/shared/EmptyState';
import { LineIcon } from '../components/shared/LineIcon';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface LocationGroup {
  location: string;
  latitude: number;
  longitude: number;
  items: any[];
}

export function MapScreen({ navigation }: TabScreenProps<'MapJourneysTab'>) {
  const theme = useMd3Theme();
  const locations = usePhotosGroupedByLocation();
  const mapRef = useRef<MapView>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationGroup | null>(null);

  const initialCamera = useMemo(() => {
    if (locations.length === 0) {
      return { target: { latitude: 35.8617, longitude: 104.1954 }, zoom: 4 };
    }
    const avgLat = locations.reduce((s, l) => s + l.latitude, 0) / locations.length;
    const avgLng = locations.reduce((s, l) => s + l.longitude, 0) / locations.length;
    return { target: { latitude: avgLat, longitude: avgLng }, zoom: 5 };
  }, [locations]);

  const focusLocation = useCallback((lat: number, lng: number) => {
    mapRef.current?.moveCamera({ target: { latitude: lat, longitude: lng }, zoom: 12 }, 500);
  }, []);

  const handleMarkerPress = useCallback((loc: LocationGroup) => {
    setSelectedLocation(loc);
    focusLocation(loc.latitude, loc.longitude);
  }, [focusLocation]);

  const handleLocationPress = useCallback(
    (location: LocationGroup) => {
      if (location.items.length > 0) {
        navigation.navigate('Lightbox', {
          photoId: location.items[0].id,
          photoIds: location.items.map((p: any) => p.id),
        });
      }
    },
    [navigation],
  );

  if (locations.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Toolbar title="地图" />
        <EmptyState icon="map" title="没有位置数据" subtitle="拍摄的照片包含 GPS 信息时会在地图上显示" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Toolbar title="地图" subtitle={`${locations.length} 个地点`} />

      <View style={styles.mapContainer}>
        {!mapLoaded && (
          <View style={[styles.loadingOverlay, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>加载地图中…</Text>
          </View>
        )}
        <MapView
          ref={mapRef}
          mapType={MapType.Standard}
          initialCameraPosition={initialCamera}
          compassEnabled={true}
          scaleControlsEnabled={true}
          zoomControlsEnabled={false}
          style={[styles.map, !mapLoaded && styles.mapHidden]}
          onLoad={() => setMapLoaded(true)}
        >
          {mapLoaded &&
            locations.map((loc) => (
              <Marker
                key={loc.location}
                position={{ latitude: loc.latitude, longitude: loc.longitude }}
                onPress={() => handleMarkerPress(loc)}
              >
                <View style={styles.markerWrap}>
                  <View style={[styles.markerBubble, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.markerCount}>{loc.items.length}</Text>
                  </View>
                  <View style={[styles.markerArrow, { borderTopColor: theme.colors.primary }]} />
                </View>
              </Marker>
            ))}
        </MapView>
      </View>

      {selectedLocation && (
        <Pressable
          style={[styles.selectedCard, { backgroundColor: theme.colors.surfaceContainer }]}
          onPress={() => {
            handleLocationPress(selectedLocation);
            setSelectedLocation(null);
          }}
        >
          <View style={styles.selectedCardHeader}>
            <LineIcon name="map-pin" size={18} color={theme.colors.primary} />
            <Text style={[styles.selectedCardName, { color: theme.colors.onSurface }]}>
              {selectedLocation.location}
            </Text>
            <Text style={[styles.selectedCardCount, { color: theme.colors.primary }]}>
              {selectedLocation.items.length} 张
            </Text>
          </View>
          <Text style={[styles.selectedCardHint, { color: theme.colors.onSurfaceVariant }]}>
            点击查看照片
          </Text>
        </Pressable>
      )}

      <View style={[styles.listContainer, { backgroundColor: theme.colors.background }]}>
        <FlashList
          data={locations}
          keyExtractor={(item) => item.location}
          horizontal
          estimatedItemSize={160}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.locationCard, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => {
                focusLocation(item.latitude, item.longitude);
                setSelectedLocation(item);
              }}
            >
              <View style={styles.locationHeader}>
                <LineIcon name="map-pin" size={14} color={theme.colors.primary} />
                <View style={{ flex: 1, marginLeft: 4 }}>
                  <Text style={[styles.locationName, { color: theme.colors.onSurface }]} numberOfLines={1}>
                    {item.location}
                  </Text>
                  <Text style={[styles.locationCount, { color: theme.colors.primary }]}>
                    {item.items.length} 张
                  </Text>
                </View>
              </View>
              {item.items[0]?.thumbnailUri && (
                <Image source={{ uri: item.items[0].thumbnailUri }} style={styles.cardThumb} />
              )}
            </Pressable>
          )}
        />
      </View>
    </View>
  );
}

const MARKER_SIZE = 36;

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  mapHidden: { width: 1, height: 1, opacity: 0 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { fontSize: 14 },
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerBubble: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  markerCount: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  selectedCard: {
    marginHorizontal: 20,
    marginTop: -48,
    borderRadius: 24,
    padding: 18,
    zIndex: 5,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  selectedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedCardName: { flex: 1, fontSize: 15, fontWeight: '600' },
  selectedCardCount: { fontSize: 14, fontWeight: '600' },
  selectedCardHint: { fontSize: 12, marginTop: 4, marginLeft: 26 },
  listContainer: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  listContent: { paddingHorizontal: 16, gap: 12 },
  locationCard: {
    width: 160,
    borderRadius: 24,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationHeader: { flexDirection: 'row', alignItems: 'center' },
  locationName: { fontSize: 13, fontWeight: '600' },
  locationCount: { fontSize: 12, marginTop: 1 },
  cardThumb: { width: '100%', height: 80, borderRadius: 16, marginTop: 6 },
});
