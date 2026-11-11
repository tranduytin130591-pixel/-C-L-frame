import React, { useRef, useState, useEffect, useCallback } from 'react';
import { HoleItem, FrameDimensions, OverlayItem } from '../types';
import { SAMPLE_PORTRAITS } from '../data/sampleFrames';
import { drawHolePath, detectHoleAtPoint, drawOverlaysOnContext, DetectedHoleResult } from '../utils/canvasPuncher';
import { Sparkles, Maximize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface CanvasAreaProps {
  frameCanvas: HTMLCanvasElement | null;
  holes: HoleItem[];
  selectedHoleId: string | null;
  overlays?: OverlayItem[];
  selectedOverlayId?: string | null;
  dimensions: FrameDimensions;
  viewMode: 'transparency' | 'sample-photos' | 'white' | 'black';
  magicWandActive: boolean;
  zoom: number;
  onSelectHole: (id: string | null) => void;
  onUpdateHole: (updated: HoleItem) => void;
  onSelectOverlay?: (id: string | null) => void;
  onUpdateOverlay?: (updated: OverlayItem) => void;
  onAddDetectedHole: (box: DetectedHoleResult) => void;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

type DragMode =
  | 'move'
  | 'move-overlay'
  | 'resize-tl'
  | 'resize-tr'
  | 'resize-bl'
  | 'resize-br'
  | 'resize-t'
  | 'resize-b'
  | 'resize-l'
  | 'resize-r'
  | null;

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  frameCanvas,
  holes,
  selectedHoleId,
  overlays = [],
  selectedOverlayId = null,
  dimensions,
  viewMode,
  magicWandActive,
  zoom,
  onSelectHole,
  onUpdateHole,
  onSelectOverlay,
  onUpdateOverlay,
  onAddDetectedHole,
  setZoom,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; initialHole: HoleItem } | null>(null);
  const [dragStartOverlay, setDragStartOverlay] = useState<{ mouseX: number; mouseY: number; initialOverlay: OverlayItem } | null>(null);
  const [sampleImages, setSampleImages] = useState<HTMLImageElement[]>([]);
  const [hoveredDetectBox, setHoveredDetectBox] = useState<DetectedHoleResult | null>(null);

  // Preload sample photos for previewing photobooth poses
  useEffect(() => {
    const loadedImgs: HTMLImageElement[] = [];
    SAMPLE_PORTRAITS.forEach((src) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      loadedImgs.push(img);
    });
    setSampleImages(loadedImgs);
  }, []);

  // Compute scale based on display resolution vs native canvas resolution
  const canvasWidth = dimensions.widthPx;
  const canvasHeight = dimensions.heightPx;

  // Auto-fit zoom on initial load
  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const padding = 60;
      const scaleX = (clientWidth - padding) / canvasWidth;
      const scaleY = (clientHeight - padding) / canvasHeight;
      const fitZoom = Math.min(scaleX, scaleY, 1);
      setZoom(Math.max(0.2, Number(fitZoom.toFixed(2))));
    }
  }, [canvasWidth, canvasHeight, setZoom]);

  // Main rendering loop for the visual display canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 1. Render underlay:
    // If 'sample-photos' mode: draw portrait photos under the holes
    if (viewMode === 'sample-photos') {
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      holes.forEach((hole, idx) => {
        const photo = sampleImages[idx % sampleImages.length];
        if (photo && photo.complete) {
          ctx.save();
          drawHolePath(ctx, hole);
          ctx.clip();

          // Cover fit image into hole
          const aspectHole = hole.width / hole.height;
          const aspectImg = (photo.naturalWidth || 1) / (photo.naturalHeight || 1);
          let drawW = hole.width;
          let drawH = hole.height;
          let drawX = hole.x;
          let drawY = hole.y;

          if (aspectImg > aspectHole) {
            drawW = hole.height * aspectImg;
            drawX = hole.x - (drawW - hole.width) / 2;
          } else {
            drawH = hole.width / aspectImg;
            drawY = hole.y - (drawH - hole.height) / 2;
          }
          ctx.drawImage(photo, drawX, drawY, drawW, drawH);
          ctx.restore();
        } else {
          // Fallback colored slot
          ctx.save();
          drawHolePath(ctx, hole);
          ctx.fillStyle = '#CBD5E1';
          ctx.fill();
          ctx.restore();
        }
      });
    } else if (viewMode === 'white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (viewMode === 'black') {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    // If 'transparency', transparent canvas shows through CSS checkered pattern!

    // 2. Render base frame graphic punched out
    if (frameCanvas) {
      // Create offscreen canvas with cutouts
      const punched = document.createElement('canvas');
      punched.width = canvasWidth;
      punched.height = canvasHeight;
      const pCtx = punched.getContext('2d')!;
      pCtx.drawImage(frameCanvas, 0, 0, canvasWidth, canvasHeight);

      // Draw overlays (Text, Logo, Stickers)
      if (overlays && overlays.length > 0) {
        drawOverlaysOnContext(pCtx, overlays);
      }

      // Punch holes out!
      pCtx.save();
      pCtx.globalCompositeOperation = 'destination-out';
      pCtx.fillStyle = '#000000';
      for (const hole of holes) {
        drawHolePath(pCtx, hole);
        pCtx.fill();
      }
      pCtx.restore();

      // Draw onto view canvas
      ctx.drawImage(punched, 0, 0);
    }

    // 3. Draw subtle cut line borders and slot markers
    holes.forEach((hole, idx) => {
      const isSelected = selectedHoleId === hole.id;

      // Draw dashed outline if transparency mode
      if (viewMode === 'transparency') {
        ctx.save();
        ctx.strokeStyle = isSelected ? '#6366F1' : 'rgba(99, 102, 241, 0.4)';
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.setLineDash(isSelected ? [] : [6, 4]);
        drawHolePath(ctx, hole);
        ctx.stroke();
        ctx.restore();
      }

      // Slot badge in the corner of hole
      ctx.save();
      const badgeSize = Math.max(24, Math.min(36, hole.width * 0.12));
      const badgeX = hole.x + 12;
      const badgeY = hole.y + 12;

      ctx.fillStyle = isSelected ? '#4F46E5' : 'rgba(15, 23, 42, 0.8)';
      ctx.beginPath();
      ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.round(badgeSize * 0.55)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `#${hole.order || idx + 1}`,
        badgeX + badgeSize / 2,
        badgeY + badgeSize / 2
      );
      ctx.restore();
    });

    // 4. Draw hover indicator for magic wand
    if (magicWandActive && hoveredDetectBox) {
      ctx.save();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);

      if (hoveredDetectBox.points && hoveredDetectBox.points.length > 2) {
        ctx.beginPath();
        ctx.moveTo(hoveredDetectBox.points[0].x, hoveredDetectBox.points[0].y);
        for (let i = 1; i < hoveredDetectBox.points.length; i++) {
          ctx.lineTo(hoveredDetectBox.points[i].x, hoveredDetectBox.points[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.strokeRect(
          hoveredDetectBox.x,
          hoveredDetectBox.y,
          hoveredDetectBox.width,
          hoveredDetectBox.height
        );
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.fillRect(
          hoveredDetectBox.x,
          hoveredDetectBox.y,
          hoveredDetectBox.width,
          hoveredDetectBox.height
        );
      }
      ctx.restore();
    }
  }, [
    frameCanvas,
    holes,
    overlays,
    selectedHoleId,
    selectedOverlayId,
    canvasWidth,
    canvasHeight,
    viewMode,
    sampleImages,
    magicWandActive,
    hoveredDetectBox,
  ]);

  // Helper to calculate overlay bounding box
  const getOverlayBounds = (item: OverlayItem) => {
    if (item.type === 'text') {
      const fontSize = item.fontSize || 36;
      const textLen = Math.max(3, item.text?.length || 4);
      const width = Math.max(60, textLen * fontSize * 0.6);
      const height = fontSize * 1.3;
      return {
        x: item.x - width / 2,
        y: item.y - height / 2,
        width,
        height,
      };
    }
    return {
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
    };
  };

  // Handle converting mouse client position to canvas coordinate space
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scale = canvasWidth / rect.width;
    return {
      x: (clientX - rect.left) * scale,
      y: (clientY - rect.top) * scale,
    };
  };

  // Mouse event handlers for moving and resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);

    // If magic wand active, try detect hole
    if (magicWandActive && frameCanvas) {
      const box = detectHoleAtPoint(frameCanvas, coords.x, coords.y);
      if (box) {
        onAddDetectedHole(box);
        return;
      }
    }

    // 1. Check if clicked on any Overlay Item (Text, Logo, Sticker)
    for (let i = overlays.length - 1; i >= 0; i--) {
      const item = overlays[i];
      const bounds = getOverlayBounds(item);
      if (
        coords.x >= bounds.x &&
        coords.x <= bounds.x + bounds.width &&
        coords.y >= bounds.y &&
        coords.y <= bounds.y + bounds.height
      ) {
        onSelectOverlay?.(item.id);
        onSelectHole(null);
        setDragMode('move-overlay');
        setDragStartOverlay({
          mouseX: coords.x,
          mouseY: coords.y,
          initialOverlay: { ...item },
        });
        return;
      }
    }

    // 2. Check if clicked inside any handle of currently selected hole
    const selectedHole = holes.find((h) => h.id === selectedHoleId);
    if (selectedHole) {
      const handleSize = 16 / zoom;
      const { x, y, width: w, height: h } = selectedHole;

      // Handle hit test
      if (Math.hypot(coords.x - x, coords.y - y) <= handleSize) {
        setDragMode('resize-tl');
        setDragStart({ mouseX: coords.x, mouseY: coords.y, initialHole: { ...selectedHole } });
        return;
      }
      if (Math.hypot(coords.x - (x + w), coords.y - y) <= handleSize) {
        setDragMode('resize-tr');
        setDragStart({ mouseX: coords.x, mouseY: coords.y, initialHole: { ...selectedHole } });
        return;
      }
      if (Math.hypot(coords.x - x, coords.y - (y + h)) <= handleSize) {
        setDragMode('resize-bl');
        setDragStart({ mouseX: coords.x, mouseY: coords.y, initialHole: { ...selectedHole } });
        return;
      }
      if (Math.hypot(coords.x - (x + w), coords.y - (y + h)) <= handleSize) {
        setDragMode('resize-br');
        setDragStart({ mouseX: coords.x, mouseY: coords.y, initialHole: { ...selectedHole } });
        return;
      }
    }

    // 3. Check if clicked inside any hole body
    for (let i = holes.length - 1; i >= 0; i--) {
      const h = holes[i];
      if (
        coords.x >= h.x &&
        coords.x <= h.x + h.width &&
        coords.y >= h.y &&
        coords.y <= h.y + h.height
      ) {
        onSelectHole(h.id);
        onSelectOverlay?.(null);
        setDragMode('move');
        setDragStart({ mouseX: coords.x, mouseY: coords.y, initialHole: { ...h } });
        return;
      }
    }

    // Clicked outside
    onSelectHole(null);
    onSelectOverlay?.(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);

    // Magic wand hover preview
    if (magicWandActive && frameCanvas && !dragMode) {
      const box = detectHoleAtPoint(frameCanvas, coords.x, coords.y);
      setHoveredDetectBox(box);
    }

    // Handle dragging overlay item
    if (dragMode === 'move-overlay' && dragStartOverlay && onUpdateOverlay) {
      const dx = coords.x - dragStartOverlay.mouseX;
      const dy = coords.y - dragStartOverlay.mouseY;
      const init = dragStartOverlay.initialOverlay;
      onUpdateOverlay({
        ...init,
        x: Math.round(init.x + dx),
        y: Math.round(init.y + dy),
      });
      return;
    }

    if (!dragMode || !dragStart) return;

    const dx = coords.x - dragStart.mouseX;
    const dy = coords.y - dragStart.mouseY;
    const init = dragStart.initialHole;

    if (dragMode === 'move') {
      const newX = Math.round(init.x + dx);
      const newY = Math.round(init.y + dy);
      onUpdateHole({ ...init, x: newX, y: newY });
    } else if (dragMode === 'resize-br') {
      const newW = Math.max(40, Math.round(init.width + dx));
      const newH = Math.max(40, Math.round(init.height + dy));
      onUpdateHole({ ...init, width: newW, height: newH });
    } else if (dragMode === 'resize-bl') {
      const newW = Math.max(40, Math.round(init.width - dx));
      const newH = Math.max(40, Math.round(init.height + dy));
      const newX = Math.round(init.x + (init.width - newW));
      onUpdateHole({ ...init, x: newX, width: newW, height: newH });
    } else if (dragMode === 'resize-tr') {
      const newW = Math.max(40, Math.round(init.width + dx));
      const newH = Math.max(40, Math.round(init.height - dy));
      const newY = Math.round(init.y + (init.height - newH));
      onUpdateHole({ ...init, y: newY, width: newW, height: newH });
    } else if (dragMode === 'resize-tl') {
      const newW = Math.max(40, Math.round(init.width - dx));
      const newH = Math.max(40, Math.round(init.height - dy));
      const newX = Math.round(init.x + (init.width - newW));
      const newY = Math.round(init.y + (init.height - newH));
      onUpdateHole({ ...init, x: newX, y: newY, width: newW, height: newH });
    }
  };

  const handleMouseUp = () => {
    setDragMode(null);
    setDragStart(null);
    setDragStartOverlay(null);
  };

  const selectedHole = holes.find((h) => h.id === selectedHoleId);
  const selectedOverlay = overlays.find((o) => o.id === selectedOverlayId);
  const selectedOverlayBounds = selectedOverlay ? getOverlayBounds(selectedOverlay) : null;

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-slate-100/90 overflow-auto relative flex items-center justify-center p-8 select-none"
      onMouseUp={handleMouseUp}
    >
      {/* Zoom / Viewport controls Floating bar */}
      <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-slate-200/80 text-xs text-slate-700">
        <button
          id="zoom-out-btn"
          onClick={() => setZoom((z) => Math.max(0.15, Number((z - 0.1).toFixed(2))))}
          className="p-1 hover:bg-slate-100 rounded-md transition-colors"
          title="Thu nhỏ"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="font-mono font-bold w-12 text-center text-[11px]">
          {Math.round(zoom * 100)}%
        </span>
        <button
          id="zoom-in-btn"
          onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.1).toFixed(2))))}
          className="p-1 hover:bg-slate-100 rounded-md transition-colors"
          title="Phóng to"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button
          id="zoom-reset-btn"
          onClick={() => {
            if (containerRef.current) {
              const { clientWidth, clientHeight } = containerRef.current;
              const scaleX = (clientWidth - 60) / canvasWidth;
              const scaleY = (clientHeight - 60) / canvasHeight;
              setZoom(Math.max(0.2, Number(Math.min(scaleX, scaleY, 1).toFixed(2))));
            }
          }}
          className="p-1 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1 text-[11px] font-medium"
          title="Vừa vặn màn hình"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Vừa khung</span>
        </button>
      </div>

      {/* Floating Magic Wand Notification when active */}
      {magicWandActive && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 bg-amber-500 text-white font-semibold text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>Chế độ đục lỗ tự động đang bật: Nhấp vào ô ảnh trên khung để đục lỗ!</span>
        </div>
      )}

      {/* Canvas Wrapper with checkered transparency background */}
      <div
        className={`relative shadow-2xl transition-transform origin-center ${
          viewMode === 'transparency' ? 'checkerboard-bg' : ''
        }`}
        style={{
          width: canvasWidth * zoom,
          height: canvasHeight * zoom,
          cursor: magicWandActive
            ? 'crosshair'
            : dragMode
            ? 'grabbing'
            : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block rounded-xs"
          style={{ imageRendering: 'auto' }}
        />

        {/* Selected Hole Transform Overlay & Handles */}
        {selectedHole && !magicWandActive && (
          <div
            className="absolute pointer-events-none border-2 border-indigo-600 ring-2 ring-indigo-500/30"
            style={{
              left: selectedHole.x * zoom,
              top: selectedHole.y * zoom,
              width: selectedHole.width * zoom,
              height: selectedHole.height * zoom,
              borderRadius:
                selectedHole.type === 'circle'
                  ? '9999px'
                  : `${(selectedHole.borderRadius || 0) * zoom}px`,
            }}
          >
            {/* Dimensions & Type label pill floating top */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-indigo-700 text-white font-mono text-[10px] font-bold shadow-md whitespace-nowrap flex items-center gap-1">
              {selectedHole.type === 'polygon' && (
                <span className="px-1 py-0.2 rounded bg-amber-400 text-slate-900 font-extrabold text-[9px]">
                  Cắt viền tự do (Tránh sticker)
                </span>
              )}
              <span>{Math.round(selectedHole.width)} × {Math.round(selectedHole.height)} px</span>
            </div>

            {/* If polygon cutout, render the exact contour outline inside bounding box */}
            {selectedHole.type === 'polygon' && selectedHole.points && selectedHole.points.length > 2 && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                viewBox={`0 0 ${selectedHole.width} ${selectedHole.height}`}
              >
                <polygon
                  points={selectedHole.points
                    .map((pt) => `${pt.x - selectedHole.x},${pt.y - selectedHole.y}`)
                    .join(' ')}
                  fill="rgba(99, 102, 241, 0.15)"
                  stroke="#4F46E5"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                />
              </svg>
            )}

            {/* Corner Resize Handles */}
            <div
              className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm shadow-sm cursor-nwse-resize pointer-events-auto"
              title="Kéo góc để thu phóng"
            />
            <div
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm shadow-sm cursor-nesw-resize pointer-events-auto"
              title="Kéo góc để thu phóng"
            />
            <div
              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm shadow-sm cursor-nesw-resize pointer-events-auto"
              title="Kéo góc để thu phóng"
            />
            <div
              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm shadow-sm cursor-nwse-resize pointer-events-auto"
              title="Kéo góc để thu phóng"
            />
          </div>
        )}

        {/* Selected Overlay Transform Box */}
        {selectedOverlay && selectedOverlayBounds && !magicWandActive && (
          <div
            className="absolute pointer-events-none border-2 border-dashed border-indigo-600 bg-indigo-500/10 rounded-sm"
            style={{
              left: selectedOverlayBounds.x * zoom,
              top: selectedOverlayBounds.y * zoom,
              width: selectedOverlayBounds.width * zoom,
              height: selectedOverlayBounds.height * zoom,
            }}
          >
            {/* Overlay label badge */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-indigo-600 text-white font-sans text-[10px] font-bold shadow-md whitespace-nowrap flex items-center gap-1">
              <span>
                {selectedOverlay.type === 'text'
                  ? `Chữ: "${selectedOverlay.text || ''}"`
                  : selectedOverlay.type === 'logo'
                  ? 'Logo'
                  : `Sticker ${selectedOverlay.stickerCode || ''}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
