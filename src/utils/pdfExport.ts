import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import { ExportSettings, FrameDimensions, HoleItem, OverlayItem } from '../types';
import { createPunchedFrameCanvas } from './canvasPuncher';

interface PlacedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Fit an image of srcW x srcH into a box, keeping aspect ratio, centered */
function fitRect(
  srcW: number,
  srcH: number,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number
): PlacedRect {
  const scale = Math.min(boxW / srcW, boxH / srcH);
  const width = srcW * scale;
  const height = srcH * scale;
  return {
    x: boxX + (boxW - width) / 2,
    y: boxY + (boxH - height) / 2,
    width,
    height,
  };
}

/** Draw L-shaped crop marks inside each corner of the given rectangle */
function drawCornerMarks(page: PDFPage, r: PlacedRect) {
  const markLength = 12;
  const inset = 15;
  const thickness = 0.5;
  const color = rgb(0.5, 0.5, 0.5);
  const left = r.x;
  const right = r.x + r.width;
  const bottom = r.y;
  const top = r.y + r.height;
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });

  // Top-left
  line(left, top - inset, left + markLength, top - inset);
  line(left + inset, top, left + inset, top - markLength);
  // Top-right
  line(right - markLength, top - inset, right, top - inset);
  line(right - inset, top, right - inset, top - markLength);
  // Bottom-left
  line(left, bottom + inset, left + markLength, bottom + inset);
  line(left + inset, bottom, left + inset, bottom + markLength);
  // Bottom-right
  line(right - markLength, bottom + inset, right, bottom + inset);
  line(right - inset, bottom, right - inset, bottom + markLength);
}

/**
 * Generates a high-quality PDF with transparent holes punched out,
 * formatted specifically for photobooth software and photobooth printers.
 */
export async function exportPhotoboothPDF(
  frameSource: HTMLImageElement | HTMLCanvasElement,
  holes: HoleItem[],
  dimensions: FrameDimensions,
  settings: ExportSettings,
  overlays?: OverlayItem[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Target DPI requested for export (e.g. 300, 450, 600 DPI)
  const targetDpi = settings.dpi || dimensions.dpi || 300;
  const baseDpi = dimensions.dpi || 300;
  const scaleFactor = Math.max(0.2, targetDpi / baseDpi);

  // Create high-resolution punched canvas with supersampled true transparency
  const punchedCanvas = createPunchedFrameCanvas(frameSource, holes, {
    overlays,
    scaleFactor,
  });

  // Convert canvas to PNG bytes to embed with full 8-bit alpha transparency
  const pngDataUrl = punchedCanvas.toDataURL('image/png');
  const pngImage = await pdfDoc.embedPng(pngDataUrl);

  // Physical size of the frame artwork in points (1 inch = 72 points in PDF standard)
  const frameWInch = dimensions.physicalWidthInch || dimensions.widthPx / baseDpi;
  const frameHInch = dimensions.physicalHeightInch || dimensions.heightPx / baseDpi;
  const frameIsLandscape = dimensions.widthPx > dimensions.heightPx;

  // Determine page size, oriented to match the frame
  let pageWidthPt: number;
  let pageHeightPt: number;
  const orient = (shortPt: number, longPt: number) => {
    pageWidthPt = frameIsLandscape ? longPt : shortPt;
    pageHeightPt = frameIsLandscape ? shortPt : longPt;
  };

  if (settings.paperSize === '4x6') {
    orient(4 * 72, 6 * 72); // 288 x 432 pt
  } else if (settings.paperSize === '2x6') {
    orient(2 * 72, 6 * 72); // 144 x 432 pt
  } else if (settings.paperSize === 'A4') {
    orient(595.28, 841.89);
  } else if (settings.paperSize === 'A6') {
    orient(297.64, 419.53);
  } else {
    // fit_frame: exact physical size calculated from inches
    pageWidthPt = frameWInch * 72;
    pageHeightPt = frameHInch * 72;
  }

  // Create page
  const page = pdfDoc.addPage([pageWidthPt!, pageHeightPt!]);

  // Place the frame without distortion: scale to fit the page (keeping aspect ratio)
  // and center it. With fit_frame this fills the page exactly.
  const rect = fitRect(
    punchedCanvas.width,
    punchedCanvas.height,
    0,
    0,
    pageWidthPt!,
    pageHeightPt!
  );
  page.drawImage(pngImage, rect);

  // Optional: Add registration/crop marks at the corners of the placed frame
  if (settings.includeCutMarks) {
    drawCornerMarks(page, rect);
  }

  // Set document metadata for professional photobooth workflow
  pdfDoc.setTitle(settings.pdfTitle || 'Photobooth Cutout Frame');
  pdfDoc.setAuthor('Photobooth Frame Puncher');
  pdfDoc.setSubject('Photobooth Transparent Template with punched photo holes');
  pdfDoc.setKeywords(['photobooth', 'cutout', 'transparent frame', 'pdf overlay', 'dslrbooth', 'breeze']);

  return await pdfDoc.save();
}

/**
 * Exports twin duplicate 2x6 strips onto a single 4x6" PDF page
 * (Standard DNP 2-inch cut setup for photobooth operators!)
 */
export async function exportTwinStrips4x6PDF(
  frameSource: HTMLImageElement | HTMLCanvasElement,
  holes: HoleItem[],
  settings: ExportSettings,
  overlays?: OverlayItem[],
  dimensions?: FrameDimensions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Target DPI requested for export
  const targetDpi = settings.dpi || dimensions?.dpi || 300;
  const baseDpi = dimensions?.dpi || 300;
  const scaleFactor = Math.max(0.2, targetDpi / baseDpi);

  // 4x6 inch = 288 pt x 432 pt
  const pageWidthPt = 288;
  const pageHeightPt = 432;
  const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

  const punchedCanvas = createPunchedFrameCanvas(frameSource, holes, {
    overlays,
    scaleFactor,
  });
  const pngDataUrl = punchedCanvas.toDataURL('image/png');
  const pngImage = await pdfDoc.embedPng(pngDataUrl);

  const stripWidthPt = pageWidthPt / 2; // 144 pt (2 inches each)

  // Strip 1 (left) and Strip 2 (right duplicate), each fitted into its 2"x6" half
  // without distortion
  for (const offsetX of [0, stripWidthPt]) {
    page.drawImage(
      pngImage,
      fitRect(punchedCanvas.width, punchedCanvas.height, offsetX, 0, stripWidthPt, pageHeightPt)
    );
  }

  // Cutting centerline guide mark
  if (settings.includeCutMarks) {
    page.drawLine({
      start: { x: stripWidthPt, y: 0 },
      end: { x: stripWidthPt, y: 15 },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6),
    });
    page.drawLine({
      start: { x: stripWidthPt, y: pageHeightPt - 15 },
      end: { x: stripWidthPt, y: pageHeightPt },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6),
    });
  }

  pdfDoc.setTitle('Photobooth 2x6 Twin Strips (4x6 Print Sheet)');
  return await pdfDoc.save();
}

/**
 * Downloads a binary blob to the user's browser
 */
export function triggerFileDownload(data: Uint8Array | Blob, filename: string, mimeType: string) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Keep the blob URL alive long enough for the download to be read. In the desktop
  // (Electron) build the file is only read after the user confirms the Save dialog,
  // so revoking it quickly cancels the download.
  setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
}
