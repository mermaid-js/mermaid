import pixelmatch from 'pixelmatch';

/** A pane's render result, at the SVG's natural size. */
export type RenderedSvg = { svg: string; width: number; height: number };

export type DiffResult = {
  changedPixels: number;
  width: number;
  height: number;
  /** Magenta-on-transparent mask, top-left aligned with both SVGs. */
  dataUrl: string;
  sizeNote: string;
};

// Keep the canvases within what browsers reliably allocate.
const MAX_CANVAS_PIXELS = 40_000_000;

function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The browser could not rasterise this SVG as an image.'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

function rasterise(
  img: HTMLImageElement,
  r: RenderedSvg,
  width: number,
  height: number,
  background: string
): Uint8ClampedArray {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2D canvas is not available.');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  // Anchor top-left at the SVG's natural size; the rest stays background.
  ctx.drawImage(img, 0, 0, r.width, r.height);
  // Throws a SecurityError if the image tainted the canvas (e.g. <foreignObject>
  // in some browsers).
  return ctx.getImageData(0, 0, width, height).data;
}

/**
 * Rasterise both SVGs onto a shared canvas size (the larger width and height)
 * over `background` and diff them with pixelmatch.
 */
export async function diffRenders(
  left: RenderedSvg,
  right: RenderedSvg,
  background: string
): Promise<DiffResult> {
  const width = Math.max(left.width, right.width);
  const height = Math.max(left.height, right.height);
  if (width * height > MAX_CANVAS_PIXELS) {
    throw new Error(`Diagram too large to diff (${width}×${height}).`);
  }
  const [leftImg, rightImg] = await Promise.all([loadSvgImage(left.svg), loadSvgImage(right.svg)]);

  let a: Uint8ClampedArray;
  let b: Uint8ClampedArray;
  try {
    a = rasterise(leftImg, left, width, height, background);
    b = rasterise(rightImg, right, width, height, background);
  } catch (e) {
    const name = e instanceof Error ? e.name : '';
    throw new Error(
      name === 'SecurityError'
        ? 'The canvas was tainted while rasterising the SVG (typically <foreignObject> HTML labels), so pixels cannot be read.'
        : `Rasterising failed: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('2D canvas is not available.');
  const out = outCtx.createImageData(width, height);
  const changedPixels = pixelmatch(a, b, out.data, width, height, {
    threshold: 0.1,
    diffColor: [255, 0, 255],
    diffMask: true,
  });
  outCtx.putImageData(out, 0, 0);

  let dataUrl: string;
  try {
    dataUrl = outCanvas.toDataURL('image/png');
  } catch (e) {
    throw new Error(
      `Could not export the diff image: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  const sizeNote =
    left.width !== right.width || left.height !== right.height
      ? `Sizes differ: left ${left.width}×${left.height}, right ${right.width}×${right.height}.`
      : '';

  return { changedPixels, width, height, dataUrl, sizeNote };
}
