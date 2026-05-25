export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface ClusterItem {
  id: string;
  point: GeoPoint;
  photoId: string;
}

export interface Cluster {
  id: string;
  point: GeoPoint;
  count: number;
  itemIds: string[];
  isCluster: boolean;
}

export interface IMapClusterService {
  cluster(
    items: ClusterItem[],
    zoomLevel: number,
    region: { latitudeDelta: number; longitudeDelta: number },
  ): Cluster[];
}
