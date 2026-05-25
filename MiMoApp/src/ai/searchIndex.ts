// ============================================================
// SearchIndex — 搜索倒排索引
// 预计算照片标签/位置/日期的倒排词条，
// 将语义搜索从 O(n) 扫描优化为 O(k) 词条查找
// 后期接入真正的 NLP 分词器
// ============================================================

import type { Photo } from '../types';

export class SearchIndex {
  private index = new Map<string, Set<string>>();
  private photoCache = new Map<string, Photo>();

  // 构建索引
  build(photos: Photo[]): void {
    this.index.clear();
    this.photoCache.clear();

    for (const photo of photos) {
      if (photo.isDeleted) continue;
      this.photoCache.set(photo.id, photo);

      // 提取索引词条
      const tokens = this.tokenize(photo);

      for (const token of tokens) {
        if (!this.index.has(token)) {
          this.index.set(token, new Set());
        }
        this.index.get(token)!.add(photo.id);
      }
    }
  }

  // 搜索
  search(query: string): Photo[] {
    const queryTokens = this.tokenizeQuery(query);
    if (queryTokens.length === 0) return [];

    const resultSets = queryTokens
      .map((token) => this.index.get(token) || new Set<string>())
      .filter((set) => set.size > 0);

    if (resultSets.length === 0) return [];

    // 交集 — 所有词条都必须匹配
    const intersection = new Set(resultSets[0]);
    for (let i = 1; i < resultSets.length; i++) {
      for (const id of intersection) {
        if (!resultSets[i].has(id)) intersection.delete(id);
      }
    }

    // 如果交集为空，回退到并集（更宽松的匹配）
    if (intersection.size === 0) {
      const union = new Set<string>();
      for (const set of resultSets) {
        for (const id of set) union.add(id);
      }
      return Array.from(union)
        .map((id) => this.photoCache.get(id))
        .filter(Boolean) as Photo[];
    }

    return Array.from(intersection)
      .map((id) => this.photoCache.get(id))
      .filter(Boolean) as Photo[];
  }

  // 多关键词 OR 搜索
  searchAny(query: string): Photo[] {
    const queryTokens = this.tokenizeQuery(query);
    const union = new Set<string>();

    for (const token of queryTokens) {
      const ids = this.index.get(token);
      if (ids) {
        for (const id of ids) union.add(id);
      }
    }

    return Array.from(union)
      .map((id) => this.photoCache.get(id))
      .filter(Boolean) as Photo[];
  }

  // 从照片中提取分词
  private tokenize(photo: Photo): string[] {
    const tokens: string[] = [];

    // 文件名分词（按分隔符拆）
    const name = photo.filename.replace(/\.[^.]+$/, '').toLowerCase();
    tokens.push(...name.split(/[-_\s]+/).filter((t) => t.length > 0));

    // 日期部分
    if (photo.dateTaken) {
      const parts = photo.dateTaken.split('-');
      if (parts.length >= 3) {
        tokens.push(parts[0]); // 年份
        tokens.push(`${parts[0]}-${parts[1]}`); // 年-月
      }
    }

    // AI 标签
    if (photo.aiTags) {
      tokens.push(...photo.aiTags.map((t) => t.toLowerCase()));
    }

    // 分类
    if (photo.aiCategory) {
      tokens.push(photo.aiCategory.toLowerCase());
    }

    // 位置名分词
    if (photo.locationName) {
      const locWords = photo.locationName
        .replace(/[省市县区]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 0);
      tokens.push(...locWords.map((w) => w.toLowerCase()));
    }

    // 收藏/评分
    if (photo.isFavorite) tokens.push('收藏');
    if (photo.rating >= 4) tokens.push('高分');

    // 去重
    return [...new Set(tokens)];
  }

  // 查询分词
  private tokenizeQuery(query: string): string[] {
    // 使用简单的字符级分词，适合中文
    const cleaned = query
      .replace(/[，。！？、""''（）\s]+/g, ' ')
      .trim()
      .toLowerCase();

    // 尝试提取连续的中文/英文词组
    const words = cleaned.split(/\s+/).filter((w) => w.length > 0);

    // 为每个词生成可能的子串（改进中文匹配）
    const result: string[] = [];
    for (const word of words) {
      result.push(word);
      // 对中文长词拆成 bigram
      if (/[一-鿿]/.test(word) && word.length >= 2) {
        for (let i = 0; i < word.length - 1; i++) {
          result.push(word.slice(i, i + 2));
        }
      }
    }

    return [...new Set(result)];
  }

  // 获取索引统计
  stats(): { totalTerms: number; totalPhotos: number; avgPerTerm: number } {
    const totalTerms = this.index.size;
    const totalPhotos = this.photoCache.size;
    let sum = 0;
    for (const ids of this.index.values()) sum += ids.size;
    return {
      totalTerms,
      totalPhotos,
      avgPerTerm: totalTerms > 0 ? Math.round(sum / totalTerms) : 0,
    };
  }

  // 清除索引
  clear(): void {
    this.index.clear();
    this.photoCache.clear();
  }
}

// 全局单例
export const searchIndex = new SearchIndex();
