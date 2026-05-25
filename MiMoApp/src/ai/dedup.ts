import type { Photo } from '../types';

export interface DedupResult {
  duplicates: Array<{ original: Photo; duplicate: Photo; similarity: number }>;
}

export function computeSimilarity(a: Photo, b: Photo): number {
  if (a.phash && b.phash) {
    return hammingSimilarity(a.phash, b.phash);
  }
  return quickRejectScore(a, b);
}

function hammingSimilarity(h1: string, h2: string): number {
  if (h1.length !== h2.length) return 0;
  let same = 0;
  for (let i = 0; i < h1.length; i++) {
    if (h1[i] === h2[i]) same++;
  }
  return same / h1.length;
}

function quickRejectScore(a: Photo, b: Photo): number {
  let score = 0;
  const sizeRatio = Math.min(a.sizeBytes, b.sizeBytes) / Math.max(a.sizeBytes, b.sizeBytes);
  if (sizeRatio > 0.9) score += 0.3;
  const dimRatio = Math.min(a.width * a.height, b.width * b.height) / Math.max(a.width * a.height, b.width * b.height);
  if (dimRatio > 0.9) score += 0.3;
  if (a.color === b.color) score += 0.2;
  if (a.locationName && a.locationName === b.locationName) score += 0.1;
  const timeDiff = Math.abs(a.createdAt - b.createdAt);
  if (timeDiff < 60000) score += 0.1;
  return score;
}

export function computePHash(grayPixels: number[], width: number, height: number): string {
  const size = 32;
  const resized = bilinearResize(grayPixels, width, height, size, size);
  const dct = applyDCT(resized, size);
  const avg = computeDCTAverage(dct, 8);
  return dctToHash(dct, 8, avg);
}

function bilinearResize(
  src: number[],
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): number[] {
  const dst = new Array(dstW * dstH);
  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;

  for (let y = 0; y < dstH; y++) {
    const srcY = y * yRatio;
    const y0 = Math.floor(srcY);
    const y1 = Math.min(y0 + 1, srcH - 1);
    const fy = srcY - y0;

    for (let x = 0; x < dstW; x++) {
      const srcX = x * xRatio;
      const x0 = Math.floor(srcX);
      const x1 = Math.min(x0 + 1, srcW - 1);
      const fx = srcX - x0;

      const top = src[y0 * srcW + x0] * (1 - fx) + src[y0 * srcW + x1] * fx;
      const bot = src[y1 * srcW + x0] * (1 - fx) + src[y1 * srcW + x1] * fx;
      dst[y * dstW + x] = top * (1 - fy) + bot * fy;
    }
  }
  return dst;
}

function applyDCT(pixels: number[], size: number): number[][] {
  const result: number[][] = [];
  for (let u = 0; u < size; u++) {
    result[u] = [];
    for (let v = 0; v < size; v++) {
      let sum = 0;
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          sum += pixels[i * size + j] *
            Math.cos(((2 * i + 1) * u * Math.PI) / (2 * size)) *
            Math.cos(((2 * j + 1) * v * Math.PI) / (2 * size));
        }
      }
      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
      result[u][v] = (1 / size) * cu * cv * sum;
    }
  }
  return result;
}

function computeDCTAverage(dct: number[][], hashSize: number): number {
  let sum = 0;
  let count = 0;
  for (let u = 0; u < hashSize; u++) {
    for (let v = 0; v < hashSize; v++) {
      if (u === 0 && v === 0) continue;
      sum += dct[u][v];
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

function dctToHash(dct: number[][], hashSize: number, avg: number): string {
  let bits = '';
  for (let u = 0; u < hashSize; u++) {
    for (let v = 0; v < hashSize; v++) {
      if (u === 0 && v === 0) continue;
      bits += dct[u][v] > avg ? '1' : '0';
    }
  }
  return bits;
}

export function findDuplicates(photos: Photo[], threshold = 0.9): DedupResult {
  const candidates = photos.filter((p) => !p.isDeleted);
  const duplicates: DedupResult['duplicates'] = [];

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const sim = computeSimilarity(candidates[i], candidates[j]);
      if (sim >= threshold) {
        duplicates.push({
          original: candidates[i],
          duplicate: candidates[j],
          similarity: sim,
        });
      }
    }
  }

  return { duplicates };
}

export function findSimilarPairs(
  photos: Photo[],
  targetPhoto: Photo,
  threshold = 0.8,
): Array<{ photo: Photo; similarity: number }> {
  return photos
    .filter((p) => !p.isDeleted && p.id !== targetPhoto.id)
    .map((p) => ({ photo: p, similarity: computeSimilarity(targetPhoto, p) }))
    .filter((r) => r.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}
