import type { IAiProcessor } from './pipeline';
import type { Photo, AiAnalysisResult, Category } from '../types';

const MOCK_LABELS: Record<Category, string[]> = {
  person: ['人像', '自拍', '合影', '户外', '微笑'],
  landscape: ['风景', '自然', '蓝天', '山水', '旅行'],
  document: ['文档', '扫描', '表格', '文字', '笔记'],
  pet: ['宠物', '可爱', '室内', '毛茸茸', '陪伴'],
  food: ['美食', '餐厅', '晚餐', '甜点', '饮品'],
  object: ['物品', '特写', '日常', '室内', '静物'],
  other: ['照片', '生活', '记录'],
};

const CATEGORIES: Category[] = ['person', 'landscape', 'document', 'pet', 'food', 'object', 'other'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class MockLabelProcessor implements IAiProcessor {
  readonly name = 'MockLabel';

  async analyze(photo: Photo): Promise<Partial<AiAnalysisResult>> {
    await new Promise<void>((r) => setTimeout(r, 50 + Math.random() * 150));

    const category: Category = photo.aiCategory ?? pick(CATEGORIES);
    const pool = MOCK_LABELS[category];
    const count = randomInt(2, pool.length);
    const labels = pool.slice(0, count);

    return {
      labels,
      category,
    };
  }
}

export class MockFaceProcessor implements IAiProcessor {
  readonly name = 'MockFace';

  async analyze(photo: Photo): Promise<Partial<AiAnalysisResult>> {
    await new Promise<void>((r) => setTimeout(r, 30 + Math.random() * 100));

    const faceCount = photo.aiCategory === 'person' ? randomInt(1, 5) : 0;

    return { faceCount };
  }
}

export class MockEmbeddingProcessor implements IAiProcessor {
  readonly name = 'MockEmbedding';

  async analyze(_photo: Photo): Promise<Partial<AiAnalysisResult>> {
    await new Promise<void>((r) => setTimeout(r, 20 + Math.random() * 80));

    const embedding: number[] = [];
    const dim = 64;
    for (let i = 0; i < dim; i++) {
      embedding.push(Math.random() * 2 - 1);
    }
    const norm = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
    return { embedding: embedding.map((v) => v / norm) };
  }
}
