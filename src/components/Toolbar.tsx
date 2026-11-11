import React from 'react';
import {
  Camera,
  Plus,
  Square,
  Circle,
  Wand2,
  Image as ImageIcon,
  Grid,
  FileDown,
  RotateCcw,
  Sparkles,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { FrameDimensions, HoleType } from '../types';

interface ToolbarProps {
  dimensions: FrameDimensions;
  viewMode: 'transparency' | 'sample-photos' | 'white' | 'black';
  magicWandActive: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onAddHole: (type: HoleType) => void;
  onToggleMagicWand: () => void;
  onOpenAutoArrange: () => void;
  onSetViewMode: (mode: 'transparency' | 'sample-photos' | 'white' | 'black') => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenExport: () => void;
  onConvertDpi?: (dpi: number) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  dimensions,
  viewMode,
  magicWandActive,
  canUndo,
  canRedo,
  onAddHole,
  onToggleMagicWand,
  onOpenAutoArrange,
  onSetViewMode,
  onUndo,
  onRedo,
  onOpenExport,
  onConvertDpi,
}) => {
  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between select-none z-20 shrink-0">
      {/* Brand & Frame info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              Photobooth Frame Puncher
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-indigo-100 text-indigo-700 rounded-md">
                PDF & PNG
              </span>
            </h1>
            <p className="text-[10px] text-slate-500">
              {dimensions.name} • {dimensions.widthPx}×{dimensions.heightPx} px ({dimensions.dpi} DPI)
            </p>
          </div>
        </div>

        {/* Workspace DPI Quality Switcher */}
        {onConvertDpi && (
          <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 gap-1 text-[11px]">
            <span className="text-[10px] font-bold text-slate-400 px-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Độ nét:
            </span>
            <button
              type="button"
              onClick={() => onConvertDpi(300)}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                dimensions.dpi === 300
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Chuyển không gian làm việc về 300 DPI (Chuẩn in thông thường)"
            >
              300 DPI
            </button>
            <button
              type="button"
              onClick={() => onConvertDpi(450)}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                dimensions.dpi === 450
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Chuyển không gian làm việc về 450 DPI (Chất lượng cao)"
            >
              450 DPI
            </button>
            <button
              type="button"
              onClick={() => onConvertDpi(600)}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                dimensions.dpi >= 600
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-purple-700 hover:text-purple-900 font-extrabold'
              }`}
              title="Chuyển không gian làm việc về 600 DPI (Siêu nét Ultra HD Print)"
            >
              600 DPI Ultra HD
            </button>
          </div>
        )}
      </div>

      {/* Middle: Hole Tools & Quick Add */}
      <div className="flex items-center gap-2">
        {/* Quick Add Hole Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 gap-1 text-xs">
          <button
            id="toolbar-add-rect"
            onClick={() => onAddHole('rect')}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
            title="Thêm lỗ chữ nhật"
          >
            <Square className="w-3.5 h-3.5 text-indigo-600" />
            <span>+ Lỗ Chữ Nhật</span>
          </button>
          <button
            id="toolbar-add-rounded"
            onClick={() => onAddHole('rounded')}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
            title="Thêm lỗ bo góc mềm mại"
          >
            <div className="w-3.5 h-3.5 rounded border-2 border-indigo-600" />
            <span>+ Lỗ Bo Góc</span>
          </button>
          <button
            id="toolbar-add-circle"
            onClick={() => onAddHole('circle')}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
            title="Thêm lỗ tròn"
          >
            <Circle className="w-3.5 h-3.5 text-indigo-600" />
            <span>+ Lỗ Tròn</span>
          </button>
        </div>

        {/* Magic Wand Auto-detection */}
        <button
          id="toolbar-btn-magic-wand"
          onClick={onToggleMagicWand}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
            magicWandActive
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/30'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
          title="Bật tính năng hút màu tự động phát hiện ô ảnh để đục lỗ"
        >
          <Wand2 className={`w-3.5 h-3.5 ${magicWandActive ? 'text-white' : 'text-amber-500'}`} />
          <span>Đục Lỗ Tự Động</span>
        </button>

        {/* Smart Auto-Arrange Holes */}
        <button
          id="toolbar-btn-auto-arrange"
          onClick={onOpenAutoArrange}
          className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-98"
          title="Tự động xếp ô lỗ đục theo các bố cục có sẵn (Dải 3 ảnh, 4 ảnh Life 4 Cuts, Lưới 2x2, Polaroid...)"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Tự Xếp Bố Cục</span>
        </button>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 gap-1 text-xs">
          <button
            id="view-mode-transparency"
            onClick={() => onSetViewMode('transparency')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'transparency'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Xem lỗ trong suốt qua lưới caro"
          >
            <Grid className="w-3.5 h-3.5 text-indigo-600" />
            <span>Lưới Caro</span>
          </button>
          <button
            id="view-mode-sample-photos"
            onClick={() => onSetViewMode('sample-photos')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'sample-photos'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Xem thử ảnh người mẫu trong photobooth"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ảnh Mẫu Thử</span>
          </button>
        </div>
      </div>

      {/* Right side: Undo/Redo & Big Export Button */}
      <div className="flex items-center gap-2">
        <button
          id="btn-undo"
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2 rounded-xl border transition-colors ${
            canUndo
              ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
              : 'border-slate-100 text-slate-300 cursor-not-allowed'
          }`}
          title="Hoàn tác (Undo)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          id="btn-open-export-modal"
          onClick={onOpenExport}
          className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-98"
        >
          <FileDown className="w-4 h-4" />
          <span>Xuất File PDF / PNG</span>
        </button>
      </div>
    </header>
  );
};
