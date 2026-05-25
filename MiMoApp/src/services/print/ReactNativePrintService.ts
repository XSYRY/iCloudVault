import type { IPrintService, PrintOptions } from './types';

type RnPrintModule = { print: (opts: Record<string, unknown>) => Promise<unknown> };

function loadRnPrint(): RnPrintModule | null {
  try {
    return require('react-native-print') as RnPrintModule;
  } catch {
    return null;
  }
}

export class ReactNativePrintService implements IPrintService {
  async print(photoUri: string, options: PrintOptions): Promise<boolean> {
    const rnPrint = loadRnPrint();
    if (!rnPrint) return false;

    try {
      await rnPrint.print({
        filePath: photoUri,
        ...this.buildPrintConfig(options),
      });
      return true;
    } catch {
      return false;
    }
  }

  async printMultiple(photoUris: string[], options: PrintOptions): Promise<number> {
    const rnPrint = loadRnPrint();
    if (!rnPrint) return 0;

    let successCount = 0;
    for (const uri of photoUris) {
      try {
        await rnPrint.print({
          filePath: uri,
          ...this.buildPrintConfig(options),
        });
        successCount += 1;
      } catch {
        continue;
      }
    }
    return successCount;
  }

  private buildPrintConfig(options: PrintOptions): Record<string, unknown> {
    return {
      copies: options.copies,
      quality: options.quality,
      includeCaption: options.includeCaption,
    };
  }
}

let _instance: ReactNativePrintService | null = null;

export function getPrintService(): ReactNativePrintService {
  if (!_instance) _instance = new ReactNativePrintService();
  return _instance;
}
