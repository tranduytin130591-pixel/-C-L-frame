/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HoleItem, LayoutPreset, FrameDimensions, HoleType, OverlayItem } from './types';
import { STANDARD_PRESETS, generateSampleFrameCanvas } from './data/sampleFrames';
import { Toolbar } from './components/Toolbar';
import { SidebarPresets } from './components/SidebarPresets';
import { CanvasArea } from './components/CanvasArea';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ExportModal } from './components/ExportModal';
import { AutoArrangeModal } from './components/AutoArrangeModal';
import { DetectedHoleResult } from './utils/canvasPuncher';

interface HistorySnapshot {
  holes: HoleItem[];
  overlays: OverlayItem[];
}

const MAX_HISTORY = 100;
const HISTORY_DEBOUNCE_MS = 350;

/**
 * Polygon holes store absolute contour points. When the hole's bounding box is moved
 * or resized, map the points from the old box into the new one so the cut follows.
 */
function syncPolygonPoints(prev: HoleItem, next: HoleItem): HoleItem {
  if (next.type !== 'polygon' || !prev.points || prev.points.length === 0) return next;
  if (
    prev.x === next.x &&
    prev.y === next.y &&
    prev.width === next.width &&
    prev.height === next.height
  ) {
    return { ...next, points: prev.points };
  }
  const sx = next.width / (prev.width || 1);
  const sy = next.height / (prev.height || 1);
  return {
    ...next,
    points: prev.points.map((p) => ({
      x: next.x + (p.x - prev.x) * sx,
      y: next.y + (p.y - prev.y) * sy,
    })),
  };
}

/** Apply a geometry patch to a hole, keeping polygon points in sync */
function patchHole(hole: HoleItem, patch: Partial<HoleItem>): HoleItem {
  return syncPolygonPoints(hole, { ...hole, ...patch });
}

function holesFromPreset(preset: LayoutPreset): HoleItem[] {
  const stamp = Date.now();
  return preset.holes.map((h, i) => ({
    ...h,
    id: `hole-${stamp}-${i}`,
    order: h.order || i + 1,
  }));
}

export default function App() {
  const initialPreset = STANDARD_PRESETS[0];

  const [currentPresetId, setCurrentPresetId] = useState<string>(initialPreset.id);
  const [dimensions, setDimensions] = useState<FrameDimensions>(initialPreset.frameDimensions);
  const [holes, setHoles] = useState<HoleItem[]>(() => holesFromPreset(initialPreset));
  const [selectedHoleId, setSelectedHoleId] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [frameCanvas, setFrameCanvas] = useState<HTMLCanvasElement | null>(null);
  const [magicWandActive, setMagicWandActive] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'transparency' | 'sample-photos' | 'white' | 'black'>('transparency');
  const [zoom, setZoom] = useState<number>(0.4);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isAutoArrangeModalOpen, setIsAutoArrangeModalOpen] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // Undo / Redo history
  // Every change to holes or overlays is snapshotted automatically (debounced so a
  // slider drag becomes one step). Changes during a canvas drag are committed once
  // when the drag ends.
  // ---------------------------------------------------------------------------
  const holesRef = useRef(holes);
  const overlaysRef = useRef(overlays);
  holesRef.current = holes;
  overlaysRef.current = overlays;

  const historyRef = useRef<HistorySnapshot[]>([{ holes, overlays }]);
  const historyIdxRef = useRef(0);
  const [historyState, setHistoryState] = useState({ idx: 0, length: 1 });
  const interactingRef = useRef(false);
  const commitTimerRef = useRef<number | null>(null);

  const syncHistoryState = () =>
    setHistoryState({ idx: historyIdxRef.current, length: historyRef.current.length });

  const commitHistory = useCallback(() => {
    if (commitTimerRef.current !== null) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    const current = historyRef.current[historyIdxRef.current];
    const snap = { holes: holesRef.current, overlays: overlaysRef.current };
    if (current && current.holes === snap.holes && current.overlays === snap.overlays) return;

    const next = historyRef.current.slice(0, historyIdxRef.current + 1);
    next.push(snap);
    while (next.length > MAX_HISTORY) next.shift();
    historyRef.current = next;
    historyIdxRef.current = next.length - 1;
    syncHistoryState();
  }, []);

  const scheduleCommit = useCallback(
    (delay: number) => {
      if (commitTimerRef.current !== null) clearTimeout(commitTimerRef.current);
      commitTimerRef.current = window.setTimeout(commitHistory, delay);
    },
    [commitHistory]
  );

  /** Start a fresh history (used when the frame itself changes) */
  const resetHistory = (newHoles: HoleItem[], newOverlays: OverlayItem[]) => {
    if (commitTimerRef.current !== null) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    historyRef.current = [{ holes: newHoles, overlays: newOverlays }];
    historyIdxRef.current = 0;
    syncHistoryState();
  };

  useEffect(() => {
    if (interactingRef.current) return;
    scheduleCommit(HISTORY_DEBOUNCE_MS);
  }, [holes, overlays, scheduleCommit]);

  const handleInteractionChange = useCallback(
    (active: boolean) => {
      interactingRef.current = active;
      if (!active) scheduleCommit(0);
    },
    [scheduleCommit]
  );

  const restoreSnapshot = (snap: HistorySnapshot) => {
    setHoles(snap.holes);
    setOverlays(snap.overlays);
    if (selectedHoleId && !snap.holes.some((h) => h.id === selectedHoleId)) {
      setSelectedHoleId(null);
    }
    if (selectedOverlayId && !snap.overlays.some((o) => o.id === selectedOverlayId)) {
      setSelectedOverlayId(null);
    }
  };

  const handleUndo = () => {
    commitHistory(); // flush a pending edit so it can be undone too
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current -= 1;
    restoreSnapshot(historyRef.current[historyIdxRef.current]);
    syncHistoryState();
  };

  const handleRedo = () => {
    commitHistory();
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current += 1;
    restoreSnapshot(historyRef.current[historyIdxRef.current]);
    syncHistoryState();
  };

  // Initialize frame canvas on mount
  useEffect(() => {
    const canvas = generateSampleFrameCanvas(
      initialPreset.defaultFrameStyle || 'retro',
      initialPreset.frameDimensions.widthPx,
      initialPreset.frameDimensions.heightPx
    );
    setFrameCanvas(canvas);
  }, []);

  // Handle preset selection
  const handleSelectPreset = (preset: LayoutPreset) => {
    setCurrentPresetId(preset.id);
    setDimensions(preset.frameDimensions);
    const newHoles = holesFromPreset(preset);
    setHoles(newHoles);
    setSelectedHoleId(newHoles[0]?.id || null);

    // Generate new decorative frame graphic
    const canvas = generateSampleFrameCanvas(
      preset.defaultFrameStyle || 'korean',
      preset.frameDimensions.widthPx,
      preset.frameDimensions.heightPx
    );
    setFrameCanvas(canvas);
    resetHistory(newHoles, overlays);
  };

  // Handle uploaded image
  const handleUploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        const prevDims = dimensions;
        const sx = img.width / prevDims.widthPx;
        const sy = img.height / prevDims.heightPx;
        // Same shape as the current layout (e.g. a 2x6 design exported at 300 or 600 DPI)
        const sameAspect = Math.abs(sx / sy - 1) < 0.01;

        let dpi: number;
        let wInch: number;
        let hInch: number;
        if (sameAspect && prevDims.physicalWidthInch > 0) {
          // Keep the print size of the current layout and infer the file's real DPI
          wInch = prevDims.physicalWidthInch;
          hInch = prevDims.physicalHeightInch;
          dpi = Math.round(img.width / wInch);
        } else {
          // Unknown print size: assume 300 DPI
          dpi = 300;
          wInch = Number((img.width / dpi).toFixed(1));
          hInch = Number((img.height / dpi).toFixed(1));
        }

        // Holes: scale them onto the new frame when the shape matches; otherwise the old
        // positions are meaningless (and may lie outside the frame), so start empty.
        const nextHoles: HoleItem[] = sameAspect
          ? holesRef.current.map((h) => ({
              ...h,
              x: Math.round(h.x * sx),
              y: Math.round(h.y * sy),
              width: Math.round(h.width * sx),
              height: Math.round(h.height * sy),
              borderRadius: h.borderRadius ? Math.round(h.borderRadius * sx) : 0,
              points: h.points?.map((p) => ({ x: p.x * sx, y: p.y * sy })),
            }))
          : [];

        // Overlays keep their relative position; size scales uniformly so they don't distort
        const s = Math.min(sx, sy);
        const nextOverlays: OverlayItem[] = overlaysRef.current.map((o) => {
          const width = Math.round(o.width * s);
          const height = Math.round(o.height * s);
          if (o.type === 'text') {
            // Text x/y is the anchor (center), not the top-left corner
            return {
              ...o,
              x: Math.round(o.x * sx),
              y: Math.round(o.y * sy),
              width,
              height,
              fontSize: o.fontSize ? Math.round(o.fontSize * s) : undefined,
            };
          }
          return {
            ...o,
            x: Math.round(Math.min(Math.max(0, o.x * sx), Math.max(0, img.width - width))),
            y: Math.round(Math.min(Math.max(0, o.y * sy), Math.max(0, img.height - height))),
            width,
            height,
            fontSize: o.fontSize ? Math.round(o.fontSize * s) : undefined,
          };
        });

        setDimensions({
          widthPx: img.width,
          heightPx: img.height,
          dpi,
          name: `Ảnh tải lên (${wInch}" × ${hInch}")`,
          aspectRatio: `${img.width}:${img.height}`,
          physicalWidthInch: wInch,
          physicalHeightInch: hInch,
        });

        setFrameCanvas(canvas);
        setCurrentPresetId('custom-upload');
        setHoles(nextHoles);
        setOverlays(nextOverlays);
        setSelectedHoleId(null);
        setSelectedOverlayId(null);
        resetHistory(nextHoles, nextOverlays);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Add new hole
  const handleAddHole = (type: HoleType) => {
    // Default size: approximately 80% of width, 3:2 ratio
    const w = Math.round(dimensions.widthPx * 0.8);
    const h = type === 'circle' ? w : Math.round(w * 0.75);
    const x = Math.round((dimensions.widthPx - w) / 2);
    const y = Math.round(dimensions.heightPx * 0.2);

    const newHole: HoleItem = {
      id: `hole-${Date.now()}`,
      order: holes.length + 1,
      type,
      x,
      y,
      width: w,
      height: h,
      rotation: 0,
      borderRadius: type === 'rounded' ? 20 : type === 'circle' ? Math.round(w / 2) : 0,
    };

    setHoles([...holes, newHole]);
    setSelectedHoleId(newHole.id);
  };

  // Auto-detected hole from magic wand (keeps the traced contour when it avoids stickers)
  const handleAddDetectedHole = (box: DetectedHoleResult) => {
    const isPolygon = box.type === 'polygon' && !!box.points && box.points.length > 2;
    const type: HoleType = isPolygon ? 'polygon' : box.type === 'rounded' ? 'rounded' : 'rect';
    const newHole: HoleItem = {
      id: `hole-${Date.now()}`,
      order: holes.length + 1,
      type,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      rotation: 0,
      borderRadius: type === 'rounded' ? box.borderRadius ?? 8 : 0,
      points: isPolygon ? box.points : undefined,
      smartBoundaryDetect: isPolygon || undefined,
    };

    setHoles([...holes, newHole]);
    setSelectedHoleId(newHole.id);
    setSelectedOverlayId(null);
    setMagicWandActive(false); // Turn off after detecting
  };

  // Update hole properties (functional update so rapid drag events never use stale state)
  const handleUpdateHole = useCallback((updated: HoleItem) => {
    setHoles((prev) => prev.map((h) => (h.id === updated.id ? syncPolygonPoints(h, updated) : h)));
  }, []);

  // Convert workspace resolution to target DPI (e.g. 300, 450, 600 DPI)
  const handleConvertDpi = (newDpi: number) => {
    if (newDpi === dimensions.dpi || !frameCanvas) return;
    const scale = newDpi / dimensions.dpi;

    // Scale frame canvas with high quality smoothing
    const newCanvas = document.createElement('canvas');
    newCanvas.width = Math.round(dimensions.widthPx * scale);
    newCanvas.height = Math.round(dimensions.heightPx * scale);
    const ctx = newCanvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(frameCanvas, 0, 0, newCanvas.width, newCanvas.height);

    // Scale holes (including polygon contour points)
    const scaledHoles: HoleItem[] = holes.map((h) => ({
      ...h,
      x: Math.round(h.x * scale),
      y: Math.round(h.y * scale),
      width: Math.round(h.width * scale),
      height: Math.round(h.height * scale),
      borderRadius: h.borderRadius ? Math.round(h.borderRadius * scale) : 0,
      points: h.points?.map((p) => ({ x: p.x * scale, y: p.y * scale })),
    }));

    // Scale overlays
    const scaledOverlays: OverlayItem[] = overlays.map((o) => ({
      ...o,
      x: Math.round(o.x * scale),
      y: Math.round(o.y * scale),
      width: Math.round(o.width * scale),
      height: Math.round(o.height * scale),
      fontSize: o.fontSize ? Math.round(o.fontSize * scale) : undefined,
    }));

    const newDimensions: FrameDimensions = {
      ...dimensions,
      widthPx: newCanvas.width,
      heightPx: newCanvas.height,
      dpi: newDpi,
    };

    setDimensions(newDimensions);
    setFrameCanvas(newCanvas);
    setHoles(scaledHoles);
    setOverlays(scaledOverlays);
    // Coordinates changed scale: older snapshots would no longer fit the frame
    resetHistory(scaledHoles, scaledOverlays);
  };

  // Delete hole
  const handleDeleteHole = (id: string) => {
    const filtered = holes.filter((h) => h.id !== id);
    // Re-index orders
    const nextHoles = filtered.map((h, i) => ({ ...h, order: i + 1 }));
    setHoles(nextHoles);
    if (selectedHoleId === id) {
      setSelectedHoleId(nextHoles[0]?.id || null);
    }
  };

  // Overlay handlers (Text, Logo, Stickers)
  const handleAddOverlay = (item: OverlayItem) => {
    setOverlays((prev) => [...prev, item]);
    setSelectedOverlayId(item.id);
    setSelectedHoleId(null);
  };

  const handleUpdateOverlay = useCallback((updated: OverlayItem) => {
    setOverlays((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }, []);

  const handleDeleteOverlay = (id: string) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
    if (selectedOverlayId === id) {
      setSelectedOverlayId(null);
    }
  };

  const handleSelectHole = (id: string | null) => {
    setSelectedHoleId(id);
    if (id) {
      setSelectedOverlayId(null);
    }
  };

  const handleSelectOverlay = (id: string | null) => {
    setSelectedOverlayId(id);
    if (id) {
      setSelectedHoleId(null);
    }
  };

  // Duplicate hole
  const handleDuplicateHole = (id: string) => {
    const target = holes.find((h) => h.id === id);
    if (!target) return;
    const duplicated: HoleItem = {
      ...patchHole(target, {
        x: Math.min(dimensions.widthPx - target.width, target.x + 30),
        y: Math.min(dimensions.heightPx - target.height, target.y + 30),
      }),
      id: `hole-${Date.now()}`,
      order: holes.length + 1,
    };
    setHoles([...holes, duplicated]);
    setSelectedHoleId(duplicated.id);
  };

  // Alignment functions
  const handleAlignHoles = (
    type: 'center-h' | 'center-v' | 'left' | 'right' | 'top' | 'bottom' | 'distribute-v'
  ) => {
    if (!selectedHoleId && type !== 'distribute-v') return;

    const alignSelected = (getPatch: (h: HoleItem) => Partial<HoleItem>) =>
      holes.map((h) => (h.id === selectedHoleId ? patchHole(h, getPatch(h)) : h));

    let nextHoles = holes;
    if (type === 'center-h') {
      nextHoles = alignSelected((h) => ({ x: Math.round((dimensions.widthPx - h.width) / 2) }));
    } else if (type === 'center-v') {
      nextHoles = alignSelected((h) => ({ y: Math.round((dimensions.heightPx - h.height) / 2) }));
    } else if (type === 'left') {
      nextHoles = alignSelected(() => ({ x: 40 }));
    } else if (type === 'right') {
      nextHoles = alignSelected((h) => ({ x: dimensions.widthPx - h.width - 40 }));
    } else if (type === 'top') {
      nextHoles = alignSelected(() => ({ y: 50 }));
    } else if (type === 'bottom') {
      nextHoles = alignSelected((h) => ({ y: dimensions.heightPx - h.height - 50 }));
    } else if (type === 'distribute-v') {
      if (holes.length < 2) return;
      // Sort by Y coordinate
      const sorted = [...holes].sort((a, b) => a.y - b.y);
      const top = sorted[0].y;
      const bottom = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
      const totalHoleH = sorted.reduce((acc, h) => acc + h.height, 0);
      const remainingSpace = bottom - top - totalHoleH;
      const gap = Math.max(10, Math.round(remainingSpace / (sorted.length - 1)));

      let currentY = top;
      nextHoles = sorted.map((h) => {
        const item = patchHole(h, { y: currentY });
        currentY += h.height + gap;
        return item;
      });
    }

    setHoles(nextHoles);
  };

  // Keyboard shortcuts. The handler is refreshed every render so it always sees the
  // latest holes/overlays/selection (no stale closures), while the listener is bound once.
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandlerRef.current = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target?.isContentEditable
    ) {
      return;
    }
    const key = e.key.toLowerCase();
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedHoleId) {
        e.preventDefault();
        handleDeleteHole(selectedHoleId);
      } else if (selectedOverlayId) {
        e.preventDefault();
        handleDeleteOverlay(selectedOverlayId);
      }
    } else if (e.key === 'Escape') {
      setSelectedHoleId(null);
      setSelectedOverlayId(null);
      setMagicWandActive(false);
    } else if ((e.ctrlKey || e.metaKey) && key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    } else if ((e.ctrlKey || e.metaKey) && key === 'y') {
      e.preventDefault();
      handleRedo();
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const selectedHole = holes.find((h) => h.id === selectedHoleId) || null;
  const selectedOverlay = overlays.find((o) => o.id === selectedOverlayId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* Top Application Toolbar */}
      <Toolbar
        dimensions={dimensions}
        viewMode={viewMode}
        magicWandActive={magicWandActive}
        canUndo={historyState.idx > 0}
        canRedo={historyState.idx < historyState.length - 1}
        onAddHole={handleAddHole}
        onToggleMagicWand={() => setMagicWandActive((v) => !v)}
        onOpenAutoArrange={() => setIsAutoArrangeModalOpen(true)}
        onSetViewMode={setViewMode}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenExport={() => setIsExportModalOpen(true)}
        onConvertDpi={handleConvertDpi}
      />

      {/* Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Presets, Decorations & Upload Sidebar */}
        <SidebarPresets
          currentPresetId={currentPresetId}
          holes={holes}
          selectedHoleId={selectedHoleId}
          overlays={overlays}
          selectedOverlayId={selectedOverlayId}
          dimensions={dimensions}
          magicWandActive={magicWandActive}
          onSelectPreset={handleSelectPreset}
          onUploadImage={handleUploadImage}
          onSelectHole={handleSelectHole}
          onDeleteHole={handleDeleteHole}
          onToggleMagicWand={() => setMagicWandActive((v) => !v)}
          onOpenAutoArrange={() => setIsAutoArrangeModalOpen(true)}
          onReorderHoles={setHoles}
          onAddOverlay={handleAddOverlay}
          onSelectOverlay={handleSelectOverlay}
          onDeleteOverlay={handleDeleteOverlay}
          onConvertDpi={handleConvertDpi}
        />

        {/* Center: Interactive Canvas Workspace */}
        <CanvasArea
          frameCanvas={frameCanvas}
          holes={holes}
          selectedHoleId={selectedHoleId}
          overlays={overlays}
          selectedOverlayId={selectedOverlayId}
          dimensions={dimensions}
          viewMode={viewMode}
          magicWandActive={magicWandActive}
          zoom={zoom}
          onSelectHole={handleSelectHole}
          onUpdateHole={handleUpdateHole}
          onSelectOverlay={handleSelectOverlay}
          onUpdateOverlay={handleUpdateOverlay}
          onAddDetectedHole={handleAddDetectedHole}
          onInteractionChange={handleInteractionChange}
          setZoom={setZoom}
        />

        {/* Right: Selected Hole & Overlay Inspector */}
        <PropertiesPanel
          hole={selectedHole}
          allHoles={holes}
          selectedOverlay={selectedOverlay}
          dimensions={dimensions}
          onUpdateHole={handleUpdateHole}
          onDeleteHole={handleDeleteHole}
          onDuplicateHole={handleDuplicateHole}
          onAlignHoles={handleAlignHoles}
          onUpdateOverlay={handleUpdateOverlay}
          onDeleteOverlay={handleDeleteOverlay}
        />
      </div>

      {/* Smart Auto-Arrange Holes Modal */}
      <AutoArrangeModal
        isOpen={isAutoArrangeModalOpen}
        frameCanvas={frameCanvas}
        dimensions={dimensions}
        onClose={() => setIsAutoArrangeModalOpen(false)}
        onApplyLayout={(newHoles) => {
          setHoles(newHoles);
          setSelectedHoleId(newHoles[0]?.id || null);
        }}
      />

      {/* Export to PDF & PNG Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        frameCanvas={frameCanvas}
        holes={holes}
        overlays={overlays}
        dimensions={dimensions}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
