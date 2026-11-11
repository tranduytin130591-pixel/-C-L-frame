import { PDFDocument, rgb } from 'pdf-lib';
import { ExportSettings, FrameDimensions, HoleItem, OverlayItem } from '../types';
import { createPunchedFrameCanvas } from './canvasPuncher';

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

  // Determine physical page dimensions in points (1 inch = 72 points in PDF standard)
  let pageWidthPt: number;
  let pageHeightPt: number;

  if (settings.paperSize === '4x6') {
    if (dimensions.physicalWidthInch > dimensions.physicalHeightInch) {
      pageWidthPt = 6 * 72; // 432 pt
      pageHeightPt = 4 * 72; // 288 pt
    } else {
      pageWidthPt = 4 * 72; // 288 pt
      pageHeightPt = 6 * 72; // 432 pt
    }
  } else if (settings.paperSize === '2x6') {
    pageWidthPt = 2 * 72; // 144 pt
    pageHeightPt = 6 * 72; // 432 pt
  } else if (settings.paperSize === 'A4') {
    pageWidthPt = 595.28;
    pageHeightPt = 841.89;
  } else if (settings.paperSize === 'A6') {
    pageWidthPt = 297.64;
    pageHeightPt = 419.53;
  } else {
    // fit_frame: exact physical size calculated from inches
    const wInch = dimensions.physicalWidthInch || dimensions.widthPx / baseDpi;
    const hInch = dimensions.physicalHeightInch || dimensions.heightPx / baseDpi;
    pageWidthPt = wInch * 72;
    pageHeightPt = hInch * 72;
  }

  // Create page
  const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

  // Draw the transparent frame image centered or fitted
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: pageWidthPt,
    height: pageHeightPt,
  });

  // Optional: Add registration/crop marks for photobooth cutting
  if (settings.includeCutMarks) {
    const markLength = 12;
    const strokeWidth = 0.5;
    const markColor = rgb(0.5, 0.5, 0.5);

    // Top-left
    page.drawLine({
      start: { x: 0, y: pageHeightPt - 15 },
      end: { x: markLength, y: pageHeightPt - 15 },
      thickness: strokeWidth,
      color: markColor,
    });
    page.drawLine({
      start: { x: 15, y: pageHeightPt },
      end: { x: 15, y: pageHeightPt - markLength },
      thickness: strokeWidth,
      color: markColor,
    });

    // Top-right
    page.drawLine({
      start: { x: pageWidthPt - markLength, y: pageHeightPt - 15 },
      end: { x: pageWidthPt, y: pageHeightPt - 15 },
      thickness: strokeWidth,
      color: markColor,
    });
    page.drawLine({
      start: { x: pageWidthPt - 15, y: pageHeightPt },
      end: { x: pageWidthPt - 15, y: pageHeightPt - markLength },
      thickness: strokeWidth,
      color: markColor,
    });

    // Bottom-left
    page.drawLine({
      start: { x: 0, y: 15 },
      end: { x: markLength, y: 15 },
      thickness: strokeWidth,
      color: markColor,
    });
    page.drawLine({
      start: { x: 15, y: 0 },
      end: { x: 15, y: markLength },
      thickness: strokeWidth,
      color: markColor,
    });

    // Bottom-right
    page.drawLine({
      start: { x: pageWidthPt - markLength, y: 15 },
      end: { x: pageWidthPt, y: 15 },
      thickness: strokeWidth,
      color: markColor,
    });
    page.drawLine({
      start: { x: pageWidthPt - 15, y: 0 },
      end: { x: pageWidthPt - 15, y: markLength },
      thickness: strokeWidth,
      color: markColor,
    });
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

  // Strip 1 (Left side)
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: stripWidthPt,
    height: pageHeightPt,
  });

  // Strip 2 (Right side duplicate)
  page.drawImage(pngImage, {
    x: stripWidthPt,
    y: 0,
    width: stripWidthPt,
    height: pageHeightPt,
  });

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
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
