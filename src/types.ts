export type HoleType = 'rect' | 'rounded' | 'circle' | 'polygon';

export interface Point2D {
  x: number;
  y: number;
}

export interface HoleItem {
  id: string;
  order: number; // 1, 2, 3, 4
  type: HoleType;
  x: number; // in pixels relative to frame resolution
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  borderRadius: number; // px
  borderWidth?: number;
  borderColor?: string;
  label?: string;
  // Custom boundary path (for non-rectangular or contour cutouts)
  points?: Point2D[];
  // Protection against cutting through overlapping stickers / overlays in frame
  smartBoundaryDetect?: boolean;
}

export type OverlayType = 'text' | 'logo' | 'sticker';

export interface OverlayItem {
  id: string;
  type: OverlayType;
  x: number; // in pixels relative to frame resolution
  y: number;
  width: number;
  height: number;
  rotation?: number; // degrees
  // For text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  // For logo
  imageSrc?: string;
  opacity?: number;
  // For ticker / sticker
  stickerCode?: string; // emoji or sticker identifier
}

export interface FrameDimensions {
  widthPx: number;
  heightPx: number;
  dpi: number;
  name: string;
  aspectRatio: string;
  physicalWidthInch: number;
  physicalHeightInch: number;
}

export interface LayoutPreset {
  id: string;
  name: string;
  nameVi: string;
  description: string;
  category: '2x6' | '4x6' | 'a4' | 'square' | 'custom';
  frameDimensions: FrameDimensions;
  holes: Omit<HoleItem, 'id'>[];
  defaultFrameStyle?: 'floral' | 'retro' | 'neon' | 'korean' | 'classic';
}

export interface ExportSettings {
  format: 'pdf' | 'png' | 'both';
  dpi: number;
  paperSize: 'fit_frame' | '4x6' | '2x6' | 'A4' | 'A6';
  includeCutMarks: boolean;
  includeSlotNumbers: boolean;
  bleedMm: number;
  pdfTitle: string;
}
