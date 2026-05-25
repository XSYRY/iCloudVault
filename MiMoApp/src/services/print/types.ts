export type PrintLayout = '4x6' | '5x7' | '8x10' | 'a4' | 'letter' | 'square';

export interface PrintLayoutInfo {
  name: string;
  widthInch: number;
  heightInch: number;
}

export interface PrintOptions {
  layout: PrintLayout;
  quality: 'draft' | 'standard' | 'high';
  copies: number;
  includeCaption: boolean;
}

export interface IPrintService {
  print(photoUri: string, options: PrintOptions): Promise<boolean>;
  printMultiple(photoUris: string[], options: PrintOptions): Promise<number>;
}

export const PRINT_LAYOUTS: Record<PrintLayout, PrintLayoutInfo> = {
  '4x6': { name: '4×6"', widthInch: 4, heightInch: 6 },
  '5x7': { name: '5×7"', widthInch: 5, heightInch: 7 },
  '8x10': { name: '8×10"', widthInch: 8, heightInch: 10 },
  a4: { name: 'A4', widthInch: 8.27, heightInch: 11.69 },
  letter: { name: 'Letter', widthInch: 8.5, heightInch: 11 },
  square: { name: '6×6"', widthInch: 6, heightInch: 6 },
};
