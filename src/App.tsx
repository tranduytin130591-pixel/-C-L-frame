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

export default function App() {
  const initialPreset = STANDARD_PRESETS[0];

  const [currentPresetId, setCurrentPresetId] = useState<string>(initialPreset.id);
  const [dimensions, setDimensions] = useState<FrameDimensions>(initialPreset.frameDimensions);
  const [holes, setHoles] = useState<HoleItem[]>(() =>
    initialPreset.holes.map((h, i) => ({
      ...h,
      id: `hole-${Date.now()}-${i}`,
      order: h.order || i + 1,
    }))
  );
  const [selectedHoleId, setSelectedHoleId] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [frameCanvas, setFrameCanvas] = useState<HTMLCanvasElement | null>(null);
  const [magicWandActive, setMagicWandActive] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'transparency' | 'sample-photos' | 'white' | 'black'>('transparency');
  const [zoom, setZoom] = useState<number>(0.4);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isAutoArrangeModalOpen, setIsAutoArrangeModalOpen] = useState<boolean>(false);

  // Undo / Redo history
  const [history, setHistory] = useState<HoleItem[][]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);

  // Record history
  const recordHistory = useCallback(
    (newHoles: HoleItem[]) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIdx + 1);
        return [...next, newHoles];
      });
      setHistoryIdx((prev) => prev + 1);
    },
    [historyIdx]
  );

  // Initialize frame canvas on mount or preset switch
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
    const newHoles: HoleItem[] = preset.holes.map((h, i) => ({
      ...h,
      id: `hole-${Date.now()}-${i}`,
      order: h.order || i + 1,
    }));
    setHoles(newHoles);
    setSelectedHoleId(newHoles[0]?.id || null);

    // Generate new decorative frame graphic
    const canvas = generateSampleFrameCanvas(
      preset.defaultFrameStyle || 'korean',
      preset.frameDimensions.widthPx,
      preset.frameDimensions.heightPx
    );
    setFrameCanvas(canvas);
    recordHistory(newHoles);
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

        // Determine physical dimensions at 300 DPI
        const dpi = 300;
        const wInch = Number((img.width / dpi).toFixed(1));
        const hInch = Number((img.height / dpi).toFixed(1));

        setDimensions({
          widthPx: img.width,
          heightPx: img.height,
          dpi: 300,
          name: `Ảnh tải lên (${wInch}" × ${hInch}")`,
          aspectRatio: `${img.width}:${img.height}`,
          physicalWidthInch: wInch,
          physicalHeightInch: hInch,
        });

        setFrameCanvas(canvas);
        setCurrentPresetId('custom-upload');
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

    const nextHoles = [...holes, newHole];
    setHoles(nextHoles);
    setSelectedHoleId(newHole.id);
    recordHistory(nextHoles);
  };

  // Auto-detected hole from magic wand
  const handleAddDetectedHole = (box: { x: number; y: number; width: number; height: number }) => {
    const newHole: HoleItem = {
      id: `hole-${Date.now()}`,
      order: holes.length + 1,
      type: 'rect',
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      rotation: 0,
      borderRadius: 0,
    };

    const nextHoles = [...holes, newHole];
    setHoles(nextHoles);
    setSelectedHoleId(newHole.id);
    recordHistory(nextHoles);
    setMagicWandActive(false); // Turn off after detecting
  };

  // Update hole properties
  const handleUpdateHole = (updated: HoleItem) => {
    const nextHoles = holes.map((h) => (h.id === updated.id ? updated : h));
    setHoles(nextHoles);
  };

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

    // Scale holes
    const scaledHoles: HoleItem[] = holes.map((h) => ({
      ...h,
      x: Math.round(h.x * scale),
      y: Math.round(h.y * scale),
      width: Math.round(h.width * scale),
      height: Math.round(h.height * scale),
      borderRadius: h.borderRadius ? Math.round(h.borderRadius * scale) : 0,
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
    recordHistory(scaledHoles);
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
    recordHistory(nextHoles);
  };

  // Overlay handlers (Text, Logo, Stickers)
  const handleAddOverlay = (item: OverlayItem) => {
    setOverlays((prev) => [...prev, item]);
    setSelectedOverlayId(item.id);
    setSelectedHoleId(null);
  };

  const handleUpdateOverlay = (updated: OverlayItem) => {
    setOverlays((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

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
      ...target,
      id: `hole-${Date.now()}`,
      order: holes.length + 1,
      x: Math.min(dimensions.widthPx - target.width, target.x + 30),
      y: Math.min(dimensions.heightPx - target.height, target.y + 30),
    };
    const nextHoles = [...holes, duplicated];
    setHoles(nextHoles);
    setSelectedHoleId(duplicated.id);
    recordHistory(nextHoles);
  };

  // Alignment functions
  const handleAlignHoles = (
    type: 'center-h' | 'center-v' | 'left' | 'right' | 'top' | 'bottom' | 'distribute-v'
  ) => {
    if (!selectedHoleId && type !== 'distribute-v') return;

    let nextHoles = [...holes];
    if (type === 'center-h') {
      nextHoles = nextHoles.map((h) =>
        h.id === selectedHoleId
          ? { ...h, x: Math.round((dimensions.widthPx - h.width) / 2) }
          : h
      );
    } else if (type === 'center-v') {
      nextHoles = nextHoles.map((h) =>
        h.id === selectedHoleId
          ? { ...h, y: Math.round((dimensions.heightPx - h.height) / 2) }
          : h
      );
    } else if (type === 'left') {
      nextHoles = nextHoles.map((h) =>
        h.id === selectedHoleId ? { ...h, x: 40 } : h
      );
    } else if (type === 'right') {
      nextHoles = nextHoles.map((h) =>
        h.id === selectedHoleId ? { ...h, x: dimensions.widthPx - h.width - 40 } : h
      );
    } else if (type === 'top') {
      nextHoles = nextHoles.map((h) =>
        h.id === selectedHoleId ? { ...h, y: 50 } : h
      );
    } else if (type === 'bottom') {
      nextHoles = nextHoles.map((h) =>
        h.id === selectedHoleId ? { ...h, y: dimensions.heightPx - h.height - 50 } : h
      );
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
        const item = { ...h, y: currentY };
        currentY += h.height + gap;
        return item;
      });
    }

    setHoles(nextHoles);
    recordHistory(nextHoles);
  };

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIdx > 0) {
      const prev = history[historyIdx - 1];
      setHoles(prev);
      setHistoryIdx(historyIdx - 1);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const next = history[historyIdx + 1];
      setHoles(next);
      setHistoryIdx(historyIdx + 1);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedHoleId) {
          handleDeleteHole(selectedHoleId);
        } else if (selectedOverlayId) {
          handleDeleteOverlay(selectedOverlayId);
        }
      }
      if (e.key === 'Escape') {
        setSelectedHoleId(null);
        setSelectedOverlayId(null);
        setMagicWandActive(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedHoleId, selectedOverlayId, historyIdx, history]);

  const selectedHole = holes.find((h) => h.id === selectedHoleId) || null;
  const selectedOverlay = overlays.find((o) => o.id === selectedOverlayId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* Top Application Toolbar */}
      <Toolbar
        dimensions={dimensions}
        viewMode={viewMode}
        magicWandActive={magicWandActive}
        canUndo={historyIdx > 0}
        canRedo={historyIdx < history.length - 1}
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
          recordHistory(newHoles);
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
