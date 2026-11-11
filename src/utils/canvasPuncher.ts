import { HoleItem, OverlayItem } from '../types';

const imageCache = new Map<string, HTMLImageElement>();
export function getOrCreateCachedImage(src: string): HTMLImageElement {
  if (imageCache.has(src)) return imageCache.get(src)!;
  const img = new Image();
  img.src = src;
  imageCache.set(src, img);
  return img;
}

/**
 * Draws text, logos, and tickers/stickers onto a canvas context
 */
export function drawOverlaysOnContext(
  ctx: CanvasRenderingContext2D,
  overlays: OverlayItem[] = [],
  scale: number = 1
) {
  for (const item of overlays) {
    ctx.save();
    if (item.type === 'text') {
      ctx.translate(item.x * scale, item.y * scale);
      if (item.rotation) ctx.rotate((item.rotation * Math.PI) / 180);
      const fontStyle = item.fontStyle || 'normal';
      const fontWeight = item.fontWeight || 'bold';
      const fontSize = Math.round((item.fontSize || 36) * scale);
      const fontFamily = item.fontFamily || 'sans-serif';
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = item.fontColor || '#1e293b';
      ctx.textAlign = item.textAlign || 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.text || '', 0, 0);
    } else if (item.type === 'sticker') {
      const cx = (item.x + item.width / 2) * scale;
      const cy = (item.y + item.height / 2) * scale;
      ctx.translate(cx, cy);
      if (item.rotation) ctx.rotate((item.rotation * Math.PI) / 180);
      const size = Math.round(Math.min(item.width, item.height) * scale);
      ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.stickerCode || '❤️', 0, 0);
    } else if (item.type === 'logo' && item.imageSrc) {
      const cx = (item.x + item.width / 2) * scale;
      const cy = (item.y + item.height / 2) * scale;
      ctx.translate(cx, cy);
      if (item.rotation) ctx.rotate((item.rotation * Math.PI) / 180);
      if (typeof item.opacity === 'number') ctx.globalAlpha = item.opacity;

      const img = getOrCreateCachedImage(item.imageSrc);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(
          img,
          (-item.width / 2) * scale,
          (-item.height / 2) * scale,
          item.width * scale,
          item.height * scale
        );
      }
    }
    ctx.restore();
  }
}

/**
 * Draws a rounded rectangle path on canvas context
 */
export function drawHolePath(
  ctx: CanvasRenderingContext2D,
  hole: HoleItem,
  scale: number = 1
) {
  ctx.beginPath();
  const hx = hole.x * scale;
  const hy = hole.y * scale;
  const hw = hole.width * scale;
  const hh = hole.height * scale;

  if (hole.type === 'polygon' && hole.points && hole.points.length > 2) {
    ctx.moveTo(hole.points[0].x * scale, hole.points[0].y * scale);
    for (let i = 1; i < hole.points.length; i++) {
      ctx.lineTo(hole.points[i].x * scale, hole.points[i].y * scale);
    }
  } else if (hole.type === 'circle') {
    const rx = hw / 2;
    const ry = hh / 2;
    const cx = hx + rx;
    const cy = hy + ry;
    ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  } else if (hole.type === 'rounded') {
    const radius = Math.min((hole.borderRadius || 16) * scale, hw / 2, hh / 2);
    const anyCtx = ctx as any;
    if (typeof anyCtx.roundRect === 'function') {
      anyCtx.roundRect(hx, hy, hw, hh, radius);
    } else {
      // Fallback
      ctx.moveTo(hx + radius, hy);
      ctx.lineTo(hx + hw - radius, hy);
      ctx.quadraticCurveTo(hx + hw, hy, hx + hw, hy + radius);
      ctx.lineTo(hx + hw, hy + hh - radius);
      ctx.quadraticCurveTo(hx + hw, hy + hh, hx + hw - radius, hy + hh);
      ctx.lineTo(hx + radius, hy + hh);
      ctx.quadraticCurveTo(hx, hy + hh, hx, hy + hh - radius);
      ctx.lineTo(hx, hy + radius);
      ctx.quadraticCurveTo(hx, hy, hx + radius, hy);
    }
  } else {
    // Standard rect
    ctx.rect(hx, hy, hw, hh);
  }
  ctx.closePath();
}

/**
 * Renders the frame graphic with holes punched out (true transparent alpha channels)
 * Supports high DPI supersampling via scaleFactor
 */
export function createPunchedFrameCanvas(
  frameSource: HTMLImageElement | HTMLCanvasElement,
  holes: HoleItem[],
  options?: {
    drawBorders?: boolean;
    borderWidth?: number;
    borderColor?: string;
    overlays?: OverlayItem[];
    scaleFactor?: number;
  }
): HTMLCanvasElement {
  const scale = options?.scaleFactor && options.scaleFactor > 0 ? options.scaleFactor : 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(frameSource.width * scale);
  canvas.height = Math.round(frameSource.height * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  // High quality interpolation for image upsampling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw the base frame graphic scaled up
  ctx.drawImage(frameSource, 0, 0, canvas.width, canvas.height);

  // 1.5 Draw decorative overlays (Text, Logo, Tickers / Stickers) with high-res vector rendering
  if (options?.overlays && options.overlays.length > 0) {
    drawOverlaysOnContext(ctx, options.overlays, scale);
  }

  // 2. Punch the holes out using 'destination-out'
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000000';

  for (const hole of holes) {
    ctx.save();
    if (hole.rotation) {
      const cx = (hole.x + hole.width / 2) * scale;
      const cy = (hole.y + hole.height / 2) * scale;
      ctx.translate(cx, cy);
      ctx.rotate((hole.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }
    drawHolePath(ctx, hole, scale);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // 3. Optional outline borders around the cutouts if requested
  if (options?.drawBorders) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = options.borderColor || '#FFFFFF';
    ctx.lineWidth = (options.borderWidth || 2) * scale;
    for (const hole of holes) {
      ctx.save();
      if (hole.rotation) {
        const cx = (hole.x + hole.width / 2) * scale;
        const cy = (hole.y + hole.height / 2) * scale;
        ctx.translate(cx, cy);
        ctx.rotate((hole.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }
      drawHolePath(ctx, hole, scale);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  return canvas;
}

export interface DetectedHoleResult {
  x: number;
  y: number;
  width: number;
  height: number;
  points?: { x: number; y: number }[];
  type?: 'rect' | 'rounded' | 'circle' | 'polygon';
  borderRadius?: number;
}

/**
 * Traces the external contour (boundary path) of a binary mask
 * using Moore-Neighbor Tracing, downsampled with Douglas-Peucker simplification.
 */
function traceContourPoints(
  mask: Uint8Array,
  w: number,
  h: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): { x: number; y: number }[] {
  // Find top-left starting pixel
  let startX = -1;
  let startY = -1;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (mask[y * w + x] === 1) {
        startX = x;
        startY = y;
        break;
      }
    }
    if (startX !== -1) break;
  }

  if (startX === -1) return [];

  // Moore neighborhood 8-directional offsets (clockwise)
  // 0: N, 1: NE, 2: E, 3: SE, 4: S, 5: SW, 6: W, 7: NW
  const dx = [0, 1, 1, 1, 0, -1, -1, -1];
  const dy = [-1, -1, 0, 1, 1, 1, 0, -1];

  const contour: { x: number; y: number }[] = [];
  let currX = startX;
  let currY = startY;
  // Treat the start pixel as reached by moving North, so the first search begins at
  // West: W, NW, N are outside for the top-left pixel and tracing proceeds clockwise.
  let dir = 0;

  contour.push({ x: currX, y: currY });

  const maxSteps = 200000;
  let steps = 0;

  while (steps < maxSteps) {
    steps++;
    // Moore neighbourhood: resume the clockwise search two steps back from the last move
    const searchDir = (dir + 6) % 8;
    let foundNext = false;

    for (let i = 0; i < 8; i++) {
      const checkDir = (searchDir + i) % 8;
      const nx = currX + dx[checkDir];
      const ny = currY + dy[checkDir];

      if (nx >= 0 && nx < w && ny >= 0 && ny < h && mask[ny * w + nx] === 1) {
        currX = nx;
        currY = ny;
        dir = checkDir;
        foundNext = true;
        break;
      }
    }

    if (!foundNext) break;

    // Returned to start pixel
    if (currX === startX && currY === startY && steps > 3) {
      break;
    }

    contour.push({ x: currX, y: currY });
  }

  // Downsample & simplify contour polygon
  if (contour.length <= 4) return contour;

  // Douglas-Peucker simplification keeps corners sharp (max deviation ~1.5px)
  const simplified = simplifyClosedPath(contour, 1.5);

  // Contour points are boundary pixel indices. Map pixel centers so the outline spans
  // the full pixel extent [minX, maxX + 1] x [minY, maxY + 1], leaving no 1px sliver of
  // frame on the right/bottom edges of the cut.
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const cx = minX + bw / 2;
  const cy = minY + bh / 2;
  const kx = bw > 1 ? bw / (bw - 1) : 1;
  const ky = bh > 1 ? bh / (bh - 1) : 1;
  return simplified.map((p) => ({
    x: cx + (p.x + 0.5 - cx) * kx,
    y: cy + (p.y + 0.5 - cy) * ky,
  }));
}

function simplifyClosedPath(
  pts: { x: number; y: number }[],
  epsilon: number
): { x: number; y: number }[] {
  if (pts.length < 4) return pts;
  // Split the loop at the point farthest from the start so both halves are open chains
  let far = 0;
  let farDist = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = (pts[i].x - pts[0].x) ** 2 + (pts[i].y - pts[0].y) ** 2;
    if (d > farDist) {
      farDist = d;
      far = i;
    }
  }
  const closed = [...pts, pts[0]];
  const keep = new Uint8Array(closed.length);
  keep[0] = 1;
  keep[far] = 1;
  keep[closed.length - 1] = 1;

  const stack: [number, number][] = [
    [0, far],
    [far, closed.length - 1],
  ];
  while (stack.length > 0) {
    const [a, b] = stack.pop()!;
    if (b - a < 2) continue;
    const ax = closed[a].x;
    const ay = closed[a].y;
    const bx = closed[b].x;
    const by = closed[b].y;
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let maxD = -1;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (ay - closed[i].y) - (ax - closed[i].x) * (by - ay)) / len;
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > epsilon) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }

  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < closed.length - 1; i++) {
    if (keep[i]) out.push(closed[i]);
  }
  return out;
}

// Frame canvases are never mutated after creation (DPI change / upload create a new
// canvas), so their pixel data can be read once and reused for every detection.
const imageDataCache = new WeakMap<HTMLCanvasElement, ImageData>();
function getCachedImageData(canvas: HTMLCanvasElement): ImageData | null {
  const cached = imageDataCache.get(canvas);
  if (cached && cached.width === canvas.width && cached.height === canvas.height) {
    return cached;
  }
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  imageDataCache.set(canvas, imgData);
  return imgData;
}

// Last flood-filled region: hovering anywhere inside it reuses the result instantly.
let lastDetect: {
  canvas: HTMLCanvasElement;
  tolerance: number;
  mask: Uint8Array; // 1 = pixel belongs to the region
  result: DetectedHoleResult | null;
} | null = null;

// Reusable BFS queue (pixel indices) to avoid reallocating per detection
let queueBuffer = new Int32Array(0);

/**
 * Auto-detect holes with smart boundary recognition.
 * It detects the solid background or placeholder area while respecting non-matching
 * intersecting icons, stickers, text, and decorative borders!
 */
export function detectHoleAtPoint(
  canvas: HTMLCanvasElement,
  clickX: number,
  clickY: number,
  tolerance: number = 28
): DetectedHoleResult | null {
  const w = canvas.width;
  const h = canvas.height;
  const px = Math.floor(clickX);
  const py = Math.floor(clickY);
  if (px < 0 || py < 0 || px >= w || py >= h) return null;

  if (
    lastDetect &&
    lastDetect.canvas === canvas &&
    lastDetect.tolerance === tolerance &&
    lastDetect.mask.length === w * h &&
    lastDetect.mask[py * w + px] === 1
  ) {
    return lastDetect.result;
  }

  const imgData = getCachedImageData(canvas);
  if (!imgData) return null;
  const data = imgData.data;

  const startIdx = (py * w + px) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  // If clicking transparent pixel, cannot detect
  if (targetA < 10) return null;

  const maxDistSq = (tolerance * 1.5) * (tolerance * 1.5);
  function colorMatch(idx: number): boolean {
    if (data[idx + 3] < 10) return false;
    // Euclidean color distance in RGB
    const dr = data[idx] - targetR;
    const dg = data[idx + 1] - targetG;
    const db = data[idx + 2] - targetB;
    return dr * dr + dg * dg + db * db <= maxDistSq;
  }

  // Flood fill. mask: 0 = unvisited, 1 = matched (in region), 2 = rejected
  const total = w * h;
  const mask = new Uint8Array(total);
  if (queueBuffer.length < total) queueBuffer = new Int32Array(total);
  const queue = queueBuffer;
  let head = 0;
  let tail = 0;
  const startPixel = py * w + px;
  queue[tail++] = startPixel;
  mask[startPixel] = 1;

  let minX = px;
  let maxX = px;
  let minY = py;
  let maxY = py;
  let count = 0;

  // Safety cap for very large canvases
  const maxSearch = 6_000_000;

  const visit = (nIdx: number) => {
    if (mask[nIdx] === 0) {
      if (colorMatch(nIdx * 4)) {
        mask[nIdx] = 1;
        queue[tail++] = nIdx;
      } else {
        mask[nIdx] = 2;
      }
    }
  };

  while (head < tail && count < maxSearch) {
    const idx = queue[head++];
    const qx = idx % w;
    const qy = (idx - qx) / w;
    count++;

    if (qx < minX) minX = qx;
    if (qx > maxX) maxX = qx;
    if (qy < minY) minY = qy;
    if (qy > maxY) maxY = qy;

    if (qx + 1 < w) visit(idx + 1);
    if (qx > 0) visit(idx - 1);
    if (qy + 1 < h) visit(idx + w);
    if (qy > 0) visit(idx - w);
  }

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;

  const remember = (result: DetectedHoleResult | null) => {
    lastDetect = { canvas, tolerance, mask, result };
    return result;
  };

  // A region spanning (almost) the whole frame is the frame background/border, not a photo slot
  if (boxW >= w * 0.97 && boxH >= h * 0.97) {
    return remember(null);
  }

  // Must be a reasonable size for a photo hole (e.g. > 35px width and height)
  if (boxW >= 35 && boxH >= 35 && count > 1000) {
    const boxArea = boxW * boxH;
    const fillRatio = count / boxArea;

    // Only a (practically) full bounding box is a plain rectangle. Anything else — a
    // sticker biting into a corner, rounded/circular slots, odd shapes — gets the traced
    // contour so the cut hugs the region and never chops decorations off. Even a small
    // corner sticker covers only a few % of the box, so the threshold must be strict.
    let points: { x: number; y: number }[] | undefined;
    let type: 'rect' | 'rounded' | 'circle' | 'polygon' = 'rect';

    if (fillRatio < 0.995) {
      const contour = traceContourPoints(mask, w, h, minX, minY, maxX, maxY);
      if (contour.length > 5) {
        points = contour;
        type = 'polygon';
      }
    }

    return remember({
      x: Math.round(minX),
      y: Math.round(minY),
      width: Math.round(boxW),
      height: Math.round(boxH),
      points,
      type,
    });
  }

  return remember(null);
}
