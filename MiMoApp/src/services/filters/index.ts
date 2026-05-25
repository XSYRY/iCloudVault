import type { Photo } from '../../types';

export type FilterType = 'warm' | 'cool' | 'bw' | 'vivid' | 'fade' | 'vintage' | 'dramatic' | null;

interface ColorMatrix {
  matrix: number[];
}

const FILTER_MATRICES: Record<string, ColorMatrix> = {
  warm: {
    matrix: [
      1.1, 0, 0, 0, 0.05,
      0, 1.0, 0, 0, 0.02,
      0, 0, 0.9, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  cool: {
    matrix: [
      0.9, 0, 0, 0, 0,
      0, 1.0, 0, 0, 0,
      0, 0, 1.15, 0, 0.05,
      0, 0, 0, 1, 0,
    ],
  },
  bw: {
    matrix: [
      0.299, 0.587, 0.114, 0, 0,
      0.299, 0.587, 0.114, 0, 0,
      0.299, 0.587, 0.114, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  vivid: {
    matrix: [
      1.3, 0, 0, 0, -0.05,
      0, 1.3, 0, 0, -0.05,
      0, 0, 1.3, 0, -0.05,
      0, 0, 0, 1, 0,
    ],
  },
  fade: {
    matrix: [
      0.9, 0, 0, 0, 0.05,
      0, 0.9, 0, 0, 0.05,
      0, 0, 0.9, 0, 0.05,
      0, 0, 0, 0.85, 0,
    ],
  },
  vintage: {
    matrix: [
      0.9, 0, 0, 0, 0.08,
      0, 0.85, 0, 0, 0.05,
      0, 0, 0.75, 0, 0.1,
      0, 0, 0, 0.9, 0,
    ],
  },
  dramatic: {
    matrix: [
      1.4, -0.1, -0.1, 0, 0.05,
      -0.1, 1.3, -0.1, 0, 0.02,
      -0.1, -0.1, 1.5, 0, 0.03,
      0, 0, 0, 1.1, 0,
    ],
  },
};

export function getFilterMatrix(filterType: FilterType): number[] | null {
  if (!filterType) return null;
  return FILTER_MATRICES[filterType]?.matrix ?? null;
}

export { FILTER_MATRICES };
