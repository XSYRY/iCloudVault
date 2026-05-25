import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  PanResponder,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useMd3Theme } from '../../theme';
import { LineIcon } from '../shared/LineIcon';
import { useAlbumStore, usePhotoStore, useUiStore } from '../../store';
import type { Photo, Album } from '../../types';

// ============================================================
// AlbumDropZone — 拖放照片到相册
// 从 GridScreen 进入选择模式后，长按照片开始拖拽
// 释放到相册 target 上完成添加
// ============================================================

interface AlbumDropZoneProps {
  selectedPhoto: Photo | null;
  onDropComplete: () => void;
  onCancel: () => void;
}

export function AlbumDropZone({ selectedPhoto, onDropComplete, onCancel }: AlbumDropZoneProps) {
  const theme = useMd3Theme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const albums = useAlbumStore((s) => s.albums);
  const addToAlbum = useAlbumStore((s) => s.addToAlbum);
  const showToast = useUiStore((s) => s.showToast);

  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [highlightedAlbum, setHighlightedAlbum] = useState<string | null>(null);
  const pan = useRef(new Animated.ValueXY()).current;

  const albumLayouts = useRef<Map<string, { x: number; y: number; w: number; h: number }>>(
    new Map(),
  );

  const handleAlbumLayout = (albumId: string, layout: { x: number; y: number; w: number; h: number }) => {
    albumLayouts.current.set(albumId, layout);
  };

  const checkHitTarget = (x: number, y: number): string | null => {
    for (const [albumId, layout] of albumLayouts.current.entries()) {
      if (
        x >= layout.x &&
        x <= layout.x + layout.w &&
        y >= layout.y &&
        y <= layout.y + layout.h
      ) {
        return albumId;
      }
    }
    return null;
  };

  const handleDrop = useCallback(
    (albumId: string) => {
      if (!selectedPhoto) return;
      addToAlbum(albumId, [selectedPhoto.id]);
      const album = albums.find((a) => a.id === albumId);
      showToast(`已添加到「${album?.name || ''}」`, 'success');
      onDropComplete();
    },
    [selectedPhoto, albums, addToAlbum, showToast, onDropComplete],
  );

  if (!selectedPhoto) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* 可拖拽的照片缩略图 */}
      <Animated.View
        style={[
          styles.dragThumb,
          {
            width: 80,
            height: 80,
            borderRadius: 12,
            borderColor: theme.colors.primary,
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          },
        ]}
      >
        <Image
          source={{ uri: selectedPhoto.thumbnailUri || selectedPhoto.uri }}
          style={styles.thumbImage}
          resizeMode="cover"
        />
        <View style={[styles.dragBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.dragBadgeText}>拖放</Text>
        </View>
      </Animated.View>

      {/* 底部相册目标区 */}
      <View
        style={[
          styles.dropBar,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderTopColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Text style={[styles.dropHint, { color: theme.colors.onSurfaceVariant }]}>
          拖放到目标相册
        </Text>
        <View style={styles.albumRow}>
          {albums.length === 0 ? (
            <Text style={[styles.noAlbums, { color: theme.colors.onSurfaceVariant }]}>
              暂无相册
            </Text>
          ) : (
            albums.slice(0, 6).map((album) => (
              <Pressable
                key={album.id}
                style={[
                  styles.albumChip,
                  {
                    backgroundColor:
                      highlightedAlbum === album.id
                        ? theme.colors.primaryContainer
                        : theme.colors.surface,
                    borderColor:
                      highlightedAlbum === album.id
                        ? theme.colors.primary
                        : theme.colors.outlineVariant,
                  },
                ]}
                onLayout={(e) => {
                  const { x, y, width, height } = e.nativeEvent.layout;
                  handleAlbumLayout(album.id, { x, y, w: width, h: height });
                }}
                onPress={() => handleDrop(album.id)}
              >
                <LineIcon name={album.isSmart ? 'sparkles' : 'folder'} size={14} color={highlightedAlbum === album.id ? theme.colors.onPrimaryContainer : theme.colors.onSurface} />
                <Text
                  style={[
                    styles.albumName,
                    {
                      color:
                        highlightedAlbum === album.id
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurface,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {album.name}
                </Text>
                <Text style={[styles.albumCount, { color: theme.colors.onSurfaceVariant }]}>
                  {album.photoCount}
                </Text>
              </Pressable>
            ))
          )}
        </View>
        <Pressable
          style={[styles.cancelBtn, { backgroundColor: theme.colors.errorContainer }]}
          onPress={onCancel}
        >
          <Text style={[styles.cancelText, { color: theme.colors.onErrorContainer }]}>取消</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dragThumb: {
    position: 'absolute',
    zIndex: 100,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  thumbImage: { width: '100%', height: '100%' },
  dragBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  dragBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  dropBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  dropHint: { fontSize: 12, marginBottom: 10, textAlign: 'center' },
  albumRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 12,
  },
  noAlbums: { fontSize: 13, paddingVertical: 12 },
  albumChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  albumName: { fontSize: 13, fontWeight: '500', maxWidth: 80 },
  albumCount: { fontSize: 11 },
  cancelBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600' },
});
