export { getAiPipeline } from './pipeline';
export type { IAiProcessor } from './pipeline';
export { MockLabelProcessor, MockFaceProcessor, MockEmbeddingProcessor } from './mockProcessors';
export { MlKitLabelProcessor, MlKitFaceProcessor, TfliteEmbeddingProcessor } from './processors';
export { findDuplicates, computeSimilarity, computePHash, findSimilarPairs } from './dedup';
export type { DedupResult } from './dedup';
export { parseIntent, getIntentSuggestions, CATEGORY_KEYWORDS, SEASON_MAP } from './nlu/parser';
export type { ParsedIntent } from './nlu/parser';
export { loadEmbeddingModel, embedText, cosineSimilarity } from './embedding';
