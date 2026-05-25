// ============================================================
// 文本嵌入 — 语义搜索
// 后期接入 TFLite MobileCLIP 模型
// 接口：embedText(text) → number[]
// ============================================================

let _embeddingModel: unknown = null;

export async function loadEmbeddingModel(): Promise<void> {
  _embeddingModel = null;
}

export async function embedText(_text: string): Promise<number[]> {
  // 后期实现：运行推理
  // return embeddingModel.run(text);
  return [];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
