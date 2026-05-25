import { NativeModules, Platform } from 'react-native';
import type { IVideoMetadataService, VideoMetadata } from './types';

const { VideoThumbnailModule } = NativeModules;

const DEFAULT_METADATA: VideoMetadata = {
  duration: 0,
  width: 0,
  height: 0,
};

/**
 * 视频元数据服务 — 调用 Android 原生 VideoThumbnailModule.getMetadata()
 *
 * 使用 MediaMetadataRetriever 获取视频元数据，
 * 替代 react-native-video v4 已废弃的 Video.getMetadata()。
 */
export class VideoMetadataService implements IVideoMetadataService {
  /**
   * 获取视频元数据。
   *
   * @param uri 视频路径（file:// 或 content://）
   * @returns { duration(ms), width, height, bitrate?, codec?, framerate? }
   */
  async getMetadata(uri: string): Promise<VideoMetadata> {
    if (Platform.OS !== 'android' || !VideoThumbnailModule) {
      // iOS 暂不支持，返回默认值
      return DEFAULT_METADATA;
    }

    try {
      const raw = await VideoThumbnailModule.getMetadata(uri);
      return {
        duration: typeof raw.duration === 'number' ? raw.duration : 0,
        width: typeof raw.width === 'number' ? raw.width : 0,
        height: typeof raw.height === 'number' ? raw.height : 0,
        bitrate: raw.bitrate ?? undefined,
        codec: raw.codec ?? undefined,
        framerate: raw.framerate ?? undefined,
      };
    } catch (error) {
      if (__DEV__) {
        console.warn('[VideoMetadataService] 获取元数据失败:', error);
      }
      return DEFAULT_METADATA;
    }
  }
}
