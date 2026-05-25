declare module '@react-native-ml-kit/face-detection' {
  export interface FaceDetectionOptions {
    landmarkMode?: 'none' | 'all';
    classificationMode?: 'none' | 'all';
    performanceMode?: 'fast' | 'accurate';
    minFaceSize?: number;
  }

  export interface DetectedFace {
    bounds?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }

  const MlKitFaceDetection: {
    detect(uri: string, options?: FaceDetectionOptions): Promise<DetectedFace[]>;
  };

  export default MlKitFaceDetection;
}
