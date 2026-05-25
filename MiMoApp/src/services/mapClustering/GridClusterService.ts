import type { ClusterItem, Cluster, IMapClusterService } from './types';

let clusterSeq = 0;
function nextClusterId(): string {
  return `cluster-${++clusterSeq}`;
}

export class GridClusterService implements IMapClusterService {
  cluster(
    items: ClusterItem[],
    _zoomLevel: number,
    region: { latitudeDelta: number; longitudeDelta: number },
  ): Cluster[] {
    if (items.length === 0) return [];

    const gridSize = region.latitudeDelta / 10;

    const gridMap = new Map<string, ClusterItem[]>();

    for (const item of items) {
      const cellLat = Math.floor(item.point.latitude / gridSize);
      const cellLon = Math.floor(item.point.longitude / gridSize);
      const key = `${cellLat}|${cellLon}`;

      const arr = gridMap.get(key) || [];
      arr.push(item);
      gridMap.set(key, arr);
    }

    const clusters: Cluster[] = [];

    for (const [, cellItems] of gridMap) {
      const avgLat =
        cellItems.reduce((s, item) => s + item.point.latitude, 0) / cellItems.length;
      const avgLon =
        cellItems.reduce((s, item) => s + item.point.longitude, 0) / cellItems.length;

      clusters.push({
        id: nextClusterId(),
        point: { latitude: avgLat, longitude: avgLon },
        count: cellItems.length,
        itemIds: cellItems.map((item) => item.id),
        isCluster: cellItems.length > 1,
      });
    }

    return clusters;
  }
}

let _instance: GridClusterService | null = null;

export function getGridClusterService(): GridClusterService {
  if (!_instance) _instance = new GridClusterService();
  return _instance;
}
