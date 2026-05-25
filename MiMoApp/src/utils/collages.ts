export interface CollageLayout {
  cols: number;
  rows: number;
  cells: Array<{ x: number; y: number; w: number; h: number }>;
}

export function getCollageLayout(count: number): CollageLayout {
  if (count <= 2) return gridLayout(1, count);
  if (count <= 4) return gridLayout(2, Math.ceil(count / 2));
  if (count <= 6) return gridLayout(2, 3);
  return gridLayout(3, Math.ceil(count / 3));
}

function gridLayout(cols: number, rows: number): CollageLayout {
  const cells: CollageLayout['cells'] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ x: c / cols, y: r / rows, w: 1 / cols, h: 1 / rows });
    }
  }
  return { cols, rows, cells };
}

export interface CollageRenderOptions {
  width: number;
  height: number;
  gap: number;
  borderRadius: number;
  backgroundColor: string;
}

export const DEFAULT_COLLAGE_OPTIONS: CollageRenderOptions = {
  width: 1080,
  height: 1080,
  gap: 8,
  borderRadius: 12,
  backgroundColor: '#000000',
};

export function computeCellFrames(
  layout: CollageLayout,
  photoCount: number,
  options: CollageRenderOptions,
): Array<{ x: number; y: number; width: number; height: number }> {
  const { width, height, gap } = options;
  const frames: Array<{ x: number; y: number; width: number; height: number }> = [];
  const count = Math.min(photoCount, layout.cells.length);

  for (let i = 0; i < count; i++) {
    const cell = layout.cells[i];
    const cellW = cell.w * width - gap;
    const cellH = cell.h * height - gap;
    frames.push({
      x: cell.x * width + gap / 2,
      y: cell.y * height + gap / 2,
      width: cellW,
      height: cellH,
    });
  }

  return frames;
}

export function computeSkiaDrawCommands(
  imageUris: string[],
  layout: CollageLayout,
  options: CollageRenderOptions,
): Array<{ uri: string; x: number; y: number; width: number; height: number; borderRadius: number }> {
  const frames = computeCellFrames(layout, imageUris.length, options);
  return frames.map((frame, i) => ({
    uri: imageUris[i],
    ...frame,
    borderRadius: options.borderRadius,
  }));
}
