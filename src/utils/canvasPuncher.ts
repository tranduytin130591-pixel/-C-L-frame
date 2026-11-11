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
      if (mask[y * w + x]) {
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
  let dir = 7; // entering from NW

  contour.push({ x: currX, y: currY });

  const maxSteps = 12000;
  let steps = 0;

  while (steps < maxSteps) {
    steps++;
    // backtrack 2 steps or start search from (dir + 5) % 8
    let searchDir = (dir + 5) % 8;
    let foundNext = false;

    for (let i = 0; i < 8; i++) {
      const checkDir = (searchDir + i) % 8;
      const nx = currX + dx[checkDir];
      const ny = currY + dy[checkDir];

      if (nx >= 0 && nx < w && ny >= 0 && ny < h && mask[ny * w + nx]) {
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

  // Simplify: Douglas-Peucker or sampling every step
  const sampleStep = Math.max(1, Math.floor(contour.length / 120));
  const simplified: { x: number; y: number }[] = [];
  for (let i = 0; i < contour.length; i += sampleStep) {
    simplified.push(contour[i]);
  }
  // Ensure closed loop
  if (simplified.length > 2) {
    simplified.push({ ...simplified[0] });
  }

  return simplified;
}

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
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const startIdx = (Math.floor(clickY) * w + Math.floor(clickX)) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  // If clicking transparent pixel, cannot detect
  if (targetA < 10) return null;

  function colorMatch(idx: number): boolean {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];
    if (a < 10) return false;
    // Euclidean color distance in RGB
    const dr = r - targetR;
    const dg = g - targetG;
    const db = b - targetB;
    return Math.sqrt(dr * dr + dg * dg + db * db) <= tolerance * 1.5;
  }

  // Flood fill / Bounding box exploration
  const visited = new Uint8Array(w * h);
  const queue: number[] = [Math.floor(clickX), Math.floor(clickY)];
  visited[Math.floor(clickY) * w + Math.floor(clickX)] = 1;

  let minX = clickX;
  let maxX = clickX;
  let minY = clickY;
  let maxY = clickY;
  let count = 0;

  // Max search limit to keep it fast
  const maxSearch = 800000;

  while (queue.length > 0 && count < maxSearch) {
    const qx = queue.shift()!;
    const qy = queue.shift()!;
    count++;

    if (qx < minX) minX = qx;
    if (qx > maxX) maxX = qx;
    if (qy < minY) minY = qy;
    if (qy > maxY) maxY = qy;

    const neighbors = [
      [qx + 1, qy],
      [qx - 1, qy],
      [qx, qy + 1],
      [qx, qy - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nIdx = ny * w + nx;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          const pixelIdx = nIdx * 4;
          if (colorMatch(pixelIdx)) {
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;

  // Must be a reasonable size for a photo hole (e.g. > 35px width and height)
  if (boxW >= 35 && boxH >= 35 && count > 1000) {
    const boxArea = boxW * boxH;
    const fillRatio = count / boxArea;

    // Check if there is significant indentation/intrusion by stickers or icons:
    // If fill ratio is less than ~92%, there are intrusions (such as a sticker or heart icon overlapping the photo hole).
    // Trace exact contour points so the cutout path hugs the stickers without chopping them off!
    let points: { x: number; y: number }[] | undefined;
    let type: 'rect' | 'rounded' | 'circle' | 'polygon' = 'rect';

    if (fillRatio < 0.93 && fillRatio > 0.4) {
      // Shape has intrusions or cut-ins by stickers: produce contour polygon
      const contour = traceContourPoints(visited, w, h, minX, minY, maxX, maxY);
      if (contour.length > 5) {
        points = contour;
        type = 'polygon';
      }
    } else {
      // Near rectangular: check corner radius
      type = 'rounded';
    }

    return {
      x: Math.round(minX),
      y: Math.round(minY),
      width: Math.round(boxW),
      height: Math.round(boxH),
      points,
      type,
      borderRadius: type === 'rounded' ? 8 : undefined,
    };
  }

  return null;
}
