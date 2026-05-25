import { NativeModules, Platform } from 'react-native';
import type { IVideoThumbnailService } from './types';

const { VideoThumbnailModule } = NativeModules;

/**
 * 视频缩略图服务 — 调用 Android 原生 VideoThumbnailModule
 *
 * 使用 MediaMetadataRetriever 提取视频指定时间点的帧，
 * 替代 react-native-video v4 已废弃的 Video.capture()。
 */
export class VideoThumbnailService implements IVideoThumbnailService {
  /**
   * 生成视频缩略图。
   *
   * @param videoUri 视频路径（file:// 或 content://）
   * @param timeMs   目标时间点（毫秒），默认 1000
   * @returns 缩略图文件 URI（file://...），失败返回空字符串
   */
  async generateThumbnail(
    videoUri: string,
    timeMs: number = 1000,
  ): Promise<string> {
    if (Platform.OS !== 'android' || !VideoThumbnailModule) {
      // iOS 暂不支持，返回空字符串（后续 Phase 可添加 iOS 实现）
      return '';
    }

    try {
      const uri = await VideoThumbnailModule.generateThumbnail(
        videoUri,
        timeMs,
        80, // JPEG 质量
      );
      return uri || '';
    } catch (error) {
      if (__DEV__) {
        console.warn('[VideoThumbnailService] 生成缩略图失败:', error);
      }
      return '';
    }
  }

  /**
   * 清理缓存的缩略图文件。
   *
   * @returns 清理的文件数量
   */
  async clearCache(): Promise<number> {
    if (Platform.OS !== 'android' || !VideoThumbnailModule) {
      return 0;
    }

    try {
      return await VideoThumbnailModule.clearThumbnailCache();
    } catch {
      return 0;
    }
  }
}
