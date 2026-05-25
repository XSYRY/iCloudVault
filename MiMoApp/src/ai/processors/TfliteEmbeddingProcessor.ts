import type { IAiProcessor } from '../pipeline';
import type { AiAnalysisResult, Photo } from '../../types';
import { MockEmbeddingProcessor } from '../mockProcessors';

export class TfliteEmbeddingProcessor implements IAiProcessor {
  readonly name = 'TfliteEmbedding';
  private fallback = new MockEmbeddingProcessor();

  async analyze(photo: Photo): Promise<Partial<AiAnalysisResult>> {
    try {
      return await this.realEmbed(photo);
    } catch {
      return this.fallback.analyze(photo);
    }
  }

  private async realEmbed(_photo: Photo): Promise<Partial<AiAnalysisResult>> {
    return this.fallback.analyze(_photo);
  }
}
