export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  bitrate?: number;
  codec?: string;
  framerate?: number;
}

export interface IVideoThumbnailService {
  generateThumbnail(videoUri: string, timeMs?: number): Promise<string>;
}

export interface IVideoMetadataService {
  getMetadata(uri: string): Promise<VideoMetadata>;
}
