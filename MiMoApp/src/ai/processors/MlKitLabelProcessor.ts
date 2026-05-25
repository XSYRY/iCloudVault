import MlKitImageLabeling from '@react-native-ml-kit/image-labeling';
import type { IAiProcessor } from '../pipeline';
import type { AiAnalysisResult, Photo, Category } from '../../types';

const LABEL_TO_CATEGORY: Record<string, Category> = {
  Person: 'person',
  Face: 'person',
  Selfie: 'person',
  Clothing: 'person',
  Landscape: 'landscape',
  Sky: 'landscape',
  Mountain: 'landscape',
  Water: 'landscape',
  Nature: 'landscape',
  Tree: 'landscape',
  Flower: 'landscape',
  Sunset: 'landscape',
  Document: 'document',
  Text: 'document',
  Receipt: 'document',
  Cat: 'pet',
  Dog: 'pet',
  Pet: 'pet',
  Animal: 'pet',
  Bird: 'pet',
  Food: 'food',
  Dish: 'food',
  Meal: 'food',
  Drink: 'food',
  Cuisine: 'food',
  Product: 'object',
  Vehicle: 'object',
  Building: 'object',
  Car: 'object',
};

function labelToCategory(label: string, confidence: number): Category | null {
  if (LABEL_TO_CATEGORY[label]) return LABEL_TO_CATEGORY[label];
  if (confidence > 0.7) return 'other';
  return null;
}

export class MlKitLabelProcessor implements IAiProcessor {
  readonly name = 'MlKitLabel';

  async analyze(photo: Photo): Promise<Partial<AiAnalysisResult>> {
    try {
      const result = await MlKitImageLabeling.label(photo.uri);
      const labels = result
        .filter((item) => item.confidence > 0.5)
        .map((item) => item.text);

      let category: Category | null = null;
      for (const item of result) {
        const cat = labelToCategory(item.text, item.confidence);
        if (cat) {
          category = cat;
          break;
        }
      }

      return {
        labels,
        category: category ?? 'other',
      };
    } catch {
      return { labels: [], category: 'other' };
    }
  }
}
