import React, { useState } from 'react';
import {
  Upload,
  Layers,
  LayoutTemplate,
  Trash2,
  Eye,
  EyeOff,
  Move,
  CheckCircle2,
  Wand2,
  Sparkles,
  HelpCircle,
  Type,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';
import { HoleItem, LayoutPreset, FrameDimensions, OverlayItem } from '../types';
import { STANDARD_PRESETS, generateSampleFrameCanvas, getPresetWithDpi } from '../data/sampleFrames';
import { STICKER_COLLECTION } from '../data/stickers';
import { getOrCreateCachedImage } from '../utils/canvasPuncher';

interface SidebarPresetsProps {
  currentPresetId: string;
  holes: HoleItem[];
  selectedHoleId: string | null;
  overlays?: OverlayItem[];
  selectedOverlayId?: string | null;
  dimensions: FrameDimensions;
  magicWandActive: boolean;
  onSelectPreset: (preset: LayoutPreset) => void;
  onUploadImage: (file: File) => void;
  onSelectHole: (id: string) => void;
  onDeleteHole: (id: string) => void;
  onToggleMagicWand: () => void;
  onOpenAutoArrange: () => void;
  onReorderHoles?: (newHoles: HoleItem[]) => void;
  onAddOverlay?: (item: OverlayItem) => void;
  onSelectOverlay?: (id: string | null) => void;
  onDeleteOverlay?: (id: string) => void;
  onConvertDpi?: (newDpi: number) => void;
}

export const SidebarPresets: React.FC<SidebarPresetsProps> = ({
  currentPresetId,
  holes,
  selectedHoleId,
  overlays = [],
  selectedOverlayId = null,
  dimensions,
  magicWandActive,
  onSelectPreset,
  onUploadImage,
  onSelectHole,
  onDeleteHole,
  onToggleMagicWand,
  onOpenAutoArrange,
  onAddOverlay,
  onSelectOverlay,
  onDeleteOverlay,
  onConvertDpi,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'decorations' | 'holes' | 'upload'>('presets');
  const [dragOver, setDragOver] = useState(false);
  const [stickerCategory, setStickerCategory] = useState<'all' | 'wedding' | 'party' | 'korean' | 'retro'>('all');
  const [presetDpi, setPresetDpi] = useState<number>(dimensions.dpi >= 600 ? 600 : 300);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadImage(e.dataTransfer.files[0]);
    }
  };

  const handleAddNewText = (textValue = 'PHOTOBOOTH 2026') => {
    if (!onAddOverlay) return;
    const newItem: OverlayItem = {
      id: 'text_' + Date.now(),
      type: 'text',
      text: textValue,
      fontSize: Math.round(dimensions.widthPx * 0.06),
      fontFamily: 'sans-serif',
      fontColor: '#1e293b',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      rotation: 0,
      x: Math.round(dimensions.widthPx / 2),
      y: Math.round(dimensions.heightPx - dimensions.heightPx * 0.08),
      width: Math.round(dimensions.widthPx * 0.6),
      height: Math.round(dimensions.widthPx * 0.08),
    };
    onAddOverlay(newItem);
    onSelectOverlay?.(newItem.id);
  };

  const handleAddNewSticker = (stickerCode: string) => {
    if (!onAddOverlay) return;
    const size = Math.round(dimensions.widthPx * 0.14);
    const newItem: OverlayItem = {
      id: 'sticker_' + Date.now(),
      type: 'sticker',
      stickerCode,
      width: size,
      height: size,
      rotation: 0,
      x: Math.round(dimensions.widthPx / 2 - size / 2),
      y: Math.round(dimensions.heightPx - dimensions.heightPx * 0.16),
    };
    onAddOverlay(newItem);
    onSelectOverlay?.(newItem.id);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onAddOverlay || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;
      // Load the image first so the logo keeps its real aspect ratio and is ready to draw
      const img = getOrCreateCachedImage(src);
      const place = () => {
        const natW = img.naturalWidth || 2;
        const natH = img.naturalHeight || 1;
        const aspect = natW / natH;
        // Fit inside 35% of the frame width and 15% of its height
        const maxW = dimensions.widthPx * 0.35;
        const maxH = dimensions.heightPx * 0.15;
        let logoWidth = maxW;
        let logoHeight = logoWidth / aspect;
        if (logoHeight > maxH) {
          logoHeight = maxH;
          logoWidth = logoHeight * aspect;
        }
        logoWidth = Math.max(1, Math.round(logoWidth));
        logoHeight = Math.max(1, Math.round(logoHeight));
        const newItem: OverlayItem = {
          id: 'logo_' + Date.now(),
          type: 'logo',
          imageSrc: src,
          width: logoWidth,
          height: logoHeight,
          opacity: 1,
          rotation: 0,
          x: Math.round(dimensions.widthPx / 2 - logoWidth / 2),
          y: Math.max(0, Math.round(dimensions.heightPx - logoHeight - 40)),
        };
        onAddOverlay(newItem);
        onSelectOverlay?.(newItem.id);
      };
      if (img.complete && img.naturalWidth > 0) {
        place();
      } else {
        img.addEventListener('load', place, { once: true });
        img.addEventListener('error', () => alert('Không đọc được file logo.'), { once: true });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const filteredStickers =
    stickerCategory === 'all'
      ? STICKER_COLLECTION
      : STICKER_COLLECTION.filter((s) => s.category === stickerCategory);

  return (
    <aside className="w-80 border-r border-slate-200 bg-white flex flex-col h-full select-none z-10 shrink-0">
      {/* Tab Header */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1">
        <button
          id="tab-btn-presets"
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-2 px-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
            activeTab === 'presets'
              ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Mẫu Bố Cục"
        >
          <LayoutTemplate className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Bố Cục</span>
        </button>

        <button
          id="tab-btn-decorations"
          onClick={() => setActiveTab('decorations')}
          className={`flex-1 py-2 px-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all relative ${
            activeTab === 'decorations'
              ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Trang Trí: Chữ, Logo, Sticker"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="truncate">Trang Trí</span>
          {overlays.length > 0 && (
            <span className="px-1 py-0.2 text-[9px] rounded-full bg-amber-100 text-amber-800 font-bold">
              {overlays.length}
            </span>
          )}
        </button>

        <button
          id="tab-btn-holes"
          onClick={() => setActiveTab('holes')}
          className={`flex-1 py-2 px-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all relative ${
            activeTab === 'holes'
              ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Lỗ Đục"
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Lỗ Đục</span>
          <span className="px-1 py-0.2 text-[9px] rounded-full bg-indigo-100 text-indigo-700 font-bold">
            {holes.length}
          </span>
        </button>

        <button
          id="tab-btn-upload"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
            activeTab === 'upload'
              ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Tải Frame"
        >
          <Upload className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Tải Frame</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: PRESETS */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            {/* Smart Auto-Arrange Feature Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-md shadow-indigo-700/20 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs">
                <div className="p-1 rounded-lg bg-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span>Tự Động Xếp Lỗ Thông Minh</span>
              </div>
              <p className="text-[11px] text-indigo-100 leading-relaxed">
                Tự động tính toán và dàn đều đối xứng các ô ảnh chuẩn 3 ảnh dọc, 4 ảnh Life 4 Cuts, lưới 2x2 hoặc Polaroid cho kích thước khung hiện tại.
              </p>
              <button
                id="btn-sidebar-open-auto-arrange"
                type="button"
                onClick={onOpenAutoArrange}
                className="w-full py-2 px-3 rounded-xl bg-white text-indigo-700 font-bold text-xs hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-98"
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>Mở Công Cụ Tự Xếp Ô</span>
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Bố Cục Mẫu Sẵn Có
                </h3>
                {/* DPI Selector for Presets */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setPresetDpi(300)}
                    className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                      presetDpi === 300
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    300 DPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetDpi(600)}
                    className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                      presetDpi === 600
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-purple-700 hover:text-purple-900'
                    }`}
                  >
                    600 DPI
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Chọn khổ chuẩn máy in để tạo nhanh vị trí đục lỗ hoặc thay thế khung của bạn:
              </p>

              <div className="space-y-2.5">
                {STANDARD_PRESETS.map((rawPreset) => {
                  const preset = presetDpi === 600 ? getPresetWithDpi(rawPreset, 600) : rawPreset;
                  const isSelected = currentPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      id={`preset-card-${preset.id}`}
                      onClick={() => onSelectPreset(preset)}
                      className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1.5 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          {preset.nameVi}
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono font-medium text-slate-600">
                          {preset.frameDimensions.aspectRatio}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 leading-snug">
                        {preset.description}
                      </span>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                        <span className="text-slate-400">{preset.holes.length} lỗ ảnh</span>
                        <span className="font-mono font-semibold text-indigo-600">
                          {preset.frameDimensions.widthPx}×{preset.frameDimensions.heightPx} px ({preset.frameDimensions.dpi} DPI)
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Magic Wand Quick Action */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-900">
                <Wand2 className="w-4 h-4 text-amber-600" />
                <span>Đục Lỗ Tự Động (Magic Wand)</span>
              </div>
              <p className="text-amber-700 text-[11px] leading-relaxed">
                Nếu khung ảnh của bạn có sẵn ô màu trắng, xanh hoặc xám, bật chế độ này và nhấp chuột vào ô để máy tự động nhận diện và đục lỗ ngay!
              </p>
              <button
                id="btn-sidebar-magic-wand"
                onClick={onToggleMagicWand}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  magicWandActive
                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400'
                    : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {magicWandActive ? 'Đang bật: Nhấp vào ô trên ảnh' : 'Bật đục lỗ tự động'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: DECORATIONS (TEXT, LOGO, STICKERS/TICKERS) */}
        {activeTab === 'decorations' && (
          <div className="space-y-4">
            {/* Intro header */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Thêm Chữ, Logo & Ticker
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Trang trí thêm chữ kỷ niệm, logo thương hiệu và các nhãn dán sticker phong cách Hàn Quốc/Y2K cho khung ảnh.
              </p>
            </div>

            {/* SECTION 1: ADD TEXT */}
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-950">
                  <Type className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Chữ / Tiêu Đề</span>
                </div>
                <button
                  id="btn-add-custom-text"
                  onClick={() => handleAddNewText('PHOTOBOOTH 2026')}
                  className="px-2 py-1 rounded-lg bg-indigo-600 text-white font-medium text-[11px] hover:bg-indigo-700 shadow-2xs flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Thêm Chữ
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-medium">Mẫu chữ nhanh:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'PHOTOBOOTH 2026',
                    'Happy Wedding 💕',
                    'Happy Birthday 🎂',
                    'Best Friends ✨',
                    'Life 4 Cuts 📸',
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      onClick={() => handleAddNewText(phrase)}
                      className="px-2 py-1 rounded-md bg-white border border-indigo-200 text-indigo-900 text-[10px] hover:bg-indigo-100/60 hover:border-indigo-300 transition-colors shadow-2xs"
                    >
                      + {phrase}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 2: ADD LOGO */}
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-purple-950">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                  <span>Logo Thương Hiệu / Sự Kiện</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600">
                Tải lên file logo PNG nền trong suốt để đóng dấu thương hiệu hoặc mã QR:
              </p>
              <input
                id="logo-upload-input"
                type="file"
                accept="image/png,image/svg+xml,image/webp,image/jpeg"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <button
                id="btn-upload-logo-file"
                onClick={() => document.getElementById('logo-upload-input')?.click()}
                className="w-full py-2 px-3 rounded-lg bg-purple-600 text-white font-medium text-xs hover:bg-purple-700 shadow-2xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Tải Lên File Logo (PNG)
              </button>
            </div>

            {/* SECTION 3: TICKER & STICKERS */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                  <span>Ticker / Sticker Dán</span>
                </h4>
                <span className="text-[10px] text-slate-400">Nhấp để dán vào frame</span>
              </div>

              {/* Category pills */}
              <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'wedding', label: 'Đám cưới' },
                  { id: 'party', label: 'Tiệc tùng' },
                  { id: 'korean', label: 'Hàn Quốc' },
                  { id: 'retro', label: 'Y2K Retro' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setStickerCategory(cat.id as any)}
                    className={`px-2 py-1 rounded-md whitespace-nowrap transition-all ${
                      stickerCategory === cat.id
                        ? 'bg-slate-800 text-white font-bold shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Stickers Grid */}
              <div className="grid grid-cols-4 gap-2 p-2 bg-slate-50/80 rounded-xl border border-slate-200 max-h-56 overflow-y-auto">
                {filteredStickers.map((sticker, idx) => (
                  <button
                    key={`${sticker.code}-${idx}`}
                    id={`sticker-btn-${idx}`}
                    onClick={() => handleAddNewSticker(sticker.code)}
                    className="p-2 bg-white rounded-lg border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/40 hover:scale-105 transition-all flex flex-col items-center justify-center gap-1 shadow-2xs group"
                    title={sticker.nameVi}
                  >
                    <span className="text-2xl leading-none select-none group-hover:scale-110 transition-transform">
                      {sticker.code}
                    </span>
                    <span className="text-[9px] text-slate-500 truncate max-w-full">
                      {sticker.nameVi}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION 4: ACTIVE OVERLAYS LIST */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-700">
                  Họa Tiết Đang Có ({overlays.length})
                </h4>
                {overlays.length > 0 && (
                  <span className="text-[10px] text-slate-400">Kéo trên ảnh để di chuyển</span>
                )}
              </div>

              {overlays.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                  Chưa có họa tiết nào. Hãy bấm thêm chữ, logo hoặc sticker ở trên!
                </div>
              ) : (
                <div className="space-y-1.5">
                  {overlays.map((item) => {
                    const isSelected = selectedOverlayId === item.id;
                    return (
                      <div
                        key={item.id}
                        id={`overlay-item-${item.id}`}
                        onClick={() => {
                          onSelectOverlay?.(item.id);
                        }}
                        className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-2xs font-semibold'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-sm">
                            {item.type === 'text' && <Type className="w-3.5 h-3.5 text-indigo-600" />}
                            {item.type === 'logo' && <ImageIcon className="w-3.5 h-3.5 text-purple-600" />}
                            {item.type === 'sticker' && <span>{item.stickerCode}</span>}
                          </div>
                          <div className="truncate">
                            <span className="font-medium text-slate-800 block truncate">
                              {item.type === 'text'
                                ? item.text || 'Dòng chữ'
                                : item.type === 'logo'
                                ? 'Logo hình ảnh'
                                : `Sticker: ${item.stickerCode}`}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Vị trí: ({item.x}, {item.y})
                            </span>
                          </div>
                        </div>

                        <button
                          id={`delete-overlay-btn-${item.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteOverlay?.(item.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa họa tiết này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'holes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Thứ tự chụp ảnh ({holes.length})
              </h3>
              <span className="text-[11px] text-slate-400">Đánh số #1, #2...</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Các lỗ đục tương ứng với thứ tự chụp ảnh của máy photobooth. Nhấp vào lỗ để chỉnh vị trí hoặc kích thước.
            </p>

            {holes.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                <p className="text-xs text-slate-500">Chưa có lỗ trống nào</p>
                <p className="text-[11px] text-slate-400">
                  Nhấn nút "+ Đục Lỗ" trên thanh công cụ để thêm ô ảnh
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {holes.map((hole, index) => {
                  const isSelected = selectedHoleId === hole.id;
                  return (
                    <div
                      key={hole.id}
                      id={`hole-item-${hole.id}`}
                      onClick={() => onSelectHole(hole.id)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                          #{hole.order || index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">
                            {hole.type === 'circle'
                              ? 'Lỗ Tròn'
                              : hole.type === 'rounded'
                              ? `Lỗ Bo Góc (R${hole.borderRadius}px)`
                              : 'Lỗ Chữ Nhật'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {Math.round(hole.width)} × {Math.round(hole.height)} px
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          id={`delete-hole-btn-${hole.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteHole(hole.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa lỗ này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Tải Khung Photobooth Của Bạn
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Tải ảnh thiết kế từ Photoshop, Canva, Illustrator (PNG, JPG, WebP) để tiến hành đục lỗ trong suốt:
              </p>

              <div
                id="drop-zone-upload"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-slate-300'
                }`}
                onClick={() => document.getElementById('frame-file-input')?.click()}
              >
                <input
                  id="frame-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      onUploadImage(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-3 text-indigo-600">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-semibold text-xs text-slate-800 mb-1">
                  Kéo thả file khung vào đây
                </p>
                <p className="text-[11px] text-slate-400 mb-3">
                  hoặc bấm để chọn file từ máy tính
                </p>
                <span className="inline-block px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium text-xs shadow-sm hover:bg-indigo-700 transition-colors">
                  Chọn ảnh frame
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mẹo in ấn chất lượng cao (DPI):</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                <li><strong className="text-slate-700">Khổ A4 (210×297mm):</strong> 2480×3508 px (300 DPI) hoặc 4960×7016 px (600 DPI) - Chuẩn in màu tài liệu, photobook hoặc poster sự kiện.</li>
                <li><strong className="text-slate-700">300 DPI:</strong> 600×1800 px (2x6") hoặc 1800×1200 px (4x6") - Chuẩn in nhanh photobooth.</li>
                <li><strong className="text-purple-700">600 DPI:</strong> 1200×3600 px (2x6") hoặc 3600×2400 px (4x6") - Siêu nét Ultra HD cho máy DNP/Hiti/Citizen, viền đục lỗ không bao giờ răng cưa!</li>
                <li>Xuất file PDF giữ trọn vẹn kênh màu và vector viền lỗ cắt.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer Dimension Info with DPI Quality Switcher */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80 text-[11px] text-slate-500 flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-700">{dimensions.widthPx} × {dimensions.heightPx} px</span>
          <span className="text-slate-400 block font-mono text-[10px]">{dimensions.name}</span>
        </div>
        {onConvertDpi ? (
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
            <button
              type="button"
              onClick={() => onConvertDpi(300)}
              className={`px-1.5 py-0.5 rounded transition-all ${
                dimensions.dpi === 300
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Đặt độ phân giải 300 DPI"
            >
              300
            </button>
            <button
              type="button"
              onClick={() => onConvertDpi(450)}
              className={`px-1.5 py-0.5 rounded transition-all ${
                dimensions.dpi === 450
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Đặt độ phân giải 450 DPI"
            >
              450
            </button>
            <button
              type="button"
              onClick={() => onConvertDpi(600)}
              className={`px-1.5 py-0.5 rounded transition-all ${
                dimensions.dpi >= 600
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-purple-700 hover:text-purple-900'
              }`}
              title="Đặt độ phân giải 600 DPI Siêu Nét"
            >
              600 DPI
            </button>
          </div>
        ) : (
          <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-bold text-[10px]">
            {dimensions.dpi} DPI
          </span>
        )}
      </div>
    </aside>
  );
};
