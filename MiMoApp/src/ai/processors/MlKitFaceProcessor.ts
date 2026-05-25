import MlKitFaceDetection from '@react-native-ml-kit/face-detection';
import type { IAiProcessor } from '../pipeline';
import type { AiAnalysisResult, Photo } from '../../types';

export class MlKitFaceProcessor implements IAiProcessor {
  readonly name = 'MlKitFace';

  async analyze(photo: Photo): Promise<Partial<AiAnalysisResult>> {
    try {
      const faces = await MlKitFaceDetection.detect(photo.uri, {
        landmarkMode: 'none',
        classificationMode: 'all',
        performanceMode: 'fast',
        minFaceSize: 0.15,
      });

      return {
        faceCount: faces.length,
      };
    } catch {
      return { faceCount: 0 };
    }
  }
}
