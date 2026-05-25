import type { IColorExtractor } from './types';

const PALETTE = [
  '#6750A4', '#E91E63', '#4CAF50', '#2196F3', '#FF9800',
  '#9C27B0', '#009688', '#FF5722', '#607D8B', '#795548',
  '#3F51B5', '#CDDC39', '#FFC107', '#00BCD4', '#F44336',
];

export class FallbackColorExtractor implements IColorExtractor {
  async extract(_uri: string): Promise<string> {
    return PALETTE[Math.floor(Math.random() * PALETTE.length)];
  }
}
