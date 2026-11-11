import React from 'react';
import {
  Square,
  Circle,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignLeft,
  AlignRight,
  AlignCenter,
  ArrowUpToLine,
  ArrowDownToLine,
  Sliders,
  Copy,
  Trash2,
  Lock,
  Unlock,
  MoveUp,
  MoveDown,
  Check,
  Code2,
  Type,
  Image as ImageIcon,
  Sparkles,
  Bold,
  Italic,
} from 'lucide-react';
import { HoleItem, FrameDimensions, HoleType, OverlayItem } from '../types';

interface PropertiesPanelProps {
  hole: HoleItem | null;
  allHoles: HoleItem[];
  selectedOverlay?: OverlayItem | null;
  dimensions: FrameDimensions;
  onUpdateHole: (updated: HoleItem) => void;
  onDeleteHole: (id: string) => void;
  onDuplicateHole: (id: string) => void;
  onAlignHoles: (type: 'center-h' | 'center-v' | 'left' | 'right' | 'top' | 'bottom' | 'distribute-v') => void;
  onUpdateOverlay?: (updated: OverlayItem) => void;
  onDeleteOverlay?: (id: string) => void;
  onDuplicateOverlay?: (id: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  hole,
  allHoles,
  selectedOverlay,
  dimensions,
  onUpdateHole,
  onDeleteHole,
  onDuplicateHole,
  onAlignHoles,
  onUpdateOverlay,
  onDeleteOverlay,
  onDuplicateOverlay,
}) => {
  const [unit, setUnit] = React.useState<'px' | 'mm' | 'in'>('px');
  const [copiedCode, setCopiedCode] = React.useState(false);

  // If an overlay (Text, Logo, Sticker) is selected, show Overlay Properties
  if (selectedOverlay) {
    return (
      <aside className="w-72 border-l border-slate-200 bg-white flex flex-col h-full select-none z-10 shrink-0 overflow-y-auto">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
              {selectedOverlay.type === 'text' ? (
                <Type className="w-3.5 h-3.5" />
              ) : selectedOverlay.type === 'logo' ? (
                <ImageIcon className="w-3.5 h-3.5" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                {selectedOverlay.type === 'text'
                  ? 'Chỉnh Sửa Chữ'
                  : selectedOverlay.type === 'logo'
                  ? 'Chỉnh Sửa Logo'
                  : 'Chỉnh Sửa Sticker'}
              </h2>
              <span className="text-[10px] text-slate-500">Họa tiết trang trí frame</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onDuplicateOverlay && (
              <button
                type="button"
                onClick={() => onDuplicateOverlay(selectedOverlay.id)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
                title="Nhân đôi họa tiết"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
            {onDeleteOverlay && (
              <button
                type="button"
                onClick={() => onDeleteOverlay(selectedOverlay.id)}
                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                title="Xóa họa tiết này"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* TEXT OVERLAY CONTROLS */}
          {selectedOverlay.type === 'text' && onUpdateOverlay && (
            <>
              {/* Text Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Nội Dung Chữ
                </label>
                <input
                  type="text"
                  value={selectedOverlay.text || ''}
                  onChange={(e) => onUpdateOverlay({ ...selectedOverlay, text: e.target.value })}
                  placeholder="Nhập nội dung..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Font Size */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Cỡ Chữ (Font Size):</span>
                  <span className="font-mono font-bold text-indigo-600">{selectedOverlay.fontSize || 36} px</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="140"
                  value={selectedOverlay.fontSize || 36}
                  onChange={(e) =>
                    onUpdateOverlay({ ...selectedOverlay, fontSize: Number(e.target.value) })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Font Family */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Kiểu Phông Chữ
                </label>
                <select
                  value={selectedOverlay.fontFamily || 'sans-serif'}
                  onChange={(e) => onUpdateOverlay({ ...selectedOverlay, fontFamily: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
                >
                  <option value="sans-serif">Sans-serif (Hiện đại, Rõ ràng)</option>
                  <option value="serif">Serif (Cổ điển, Sang trọng)</option>
                  <option value="cursive">Cursive (Chữ viết tay, Mềm mại)</option>
                  <option value="monospace">Monospace (Máy đánh chữ Retro)</option>
                  <option value="'Impact', sans-serif">Impact (In đậm Nổi bật)</option>
                </select>
              </div>

              {/* Style & Align */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Định Dạng & Căn Lề
                </label>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateOverlay({
                        ...selectedOverlay,
                        fontWeight: selectedOverlay.fontWeight === 'bold' ? 'normal' : 'bold',
                      })
                    }
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedOverlay.fontWeight === 'bold'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="In đậm"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateOverlay({
                        ...selectedOverlay,
                        fontStyle: selectedOverlay.fontStyle === 'italic' ? 'normal' : 'italic',
                      })
                    }
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedOverlay.fontStyle === 'italic'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="In nghiêng"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-[1px] h-4 bg-slate-300 mx-1" />
                  <button
                    type="button"
                    onClick={() => onUpdateOverlay({ ...selectedOverlay, textAlign: 'left' })}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedOverlay.textAlign === 'left'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Căn trái"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateOverlay({ ...selectedOverlay, textAlign: 'center' })}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedOverlay.textAlign === 'center' || !selectedOverlay.textAlign
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Căn giữa"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateOverlay({ ...selectedOverlay, textAlign: 'right' })}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedOverlay.textAlign === 'right'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Căn phải"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Font Color */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Màu Sắc Chữ
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedOverlay.fontColor || '#1e293b'}
                    onChange={(e) => onUpdateOverlay({ ...selectedOverlay, fontColor: e.target.value })}
                    className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <div className="flex items-center gap-1 flex-1">
                    {['#1e293b', '#ffffff', '#d97706', '#e11d48', '#ec4899', '#2563eb', '#059669'].map(
                      (c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => onUpdateOverlay({ ...selectedOverlay, fontColor: c })}
                          className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs hover:scale-110 transition-transform"
                          style={{ backgroundColor: c }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* LOGO OVERLAY CONTROLS */}
          {selectedOverlay.type === 'logo' && onUpdateOverlay && (
            <>
              {selectedOverlay.imageSrc && (
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex justify-center items-center h-28">
                  <img
                    src={selectedOverlay.imageSrc}
                    alt="Logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}

              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Chiều Rộng</label>
                  <input
                    type="number"
                    value={selectedOverlay.width}
                    onChange={(e) =>
                      onUpdateOverlay({ ...selectedOverlay, width: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Chiều Cao</label>
                  <input
                    type="number"
                    value={selectedOverlay.height}
                    onChange={(e) =>
                      onUpdateOverlay({ ...selectedOverlay, height: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Độ Trong Suốt (Opacity):</span>
                  <span className="font-mono font-bold text-indigo-600">
                    {Math.round((selectedOverlay.opacity ?? 1) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={selectedOverlay.opacity ?? 1}
                  onChange={(e) =>
                    onUpdateOverlay({ ...selectedOverlay, opacity: Number(e.target.value) })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </>
          )}

          {/* STICKER OVERLAY CONTROLS */}
          {selectedOverlay.type === 'sticker' && onUpdateOverlay && (
            <>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
                <span className="text-5xl drop-shadow-sm">{selectedOverlay.stickerCode || '❤️'}</span>
              </div>

              {/* Size Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Kích Thước Sticker:</span>
                  <span className="font-mono font-bold text-indigo-600">{selectedOverlay.width} px</span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="220"
                  value={selectedOverlay.width}
                  onChange={(e) => {
                    const sz = Number(e.target.value);
                    onUpdateOverlay({ ...selectedOverlay, width: sz, height: sz });
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Rotation Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Góc Xoay:</span>
                  <span className="font-mono font-bold text-indigo-600">{selectedOverlay.rotation || 0}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={selectedOverlay.rotation || 0}
                  onChange={(e) =>
                    onUpdateOverlay({ ...selectedOverlay, rotation: Number(e.target.value) })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </>
          )}

          {/* Position Coordinates (for all overlays) */}
          {onUpdateOverlay && (
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Tọa Độ Vị Trí (PX)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono">Tọa độ X</span>
                  <input
                    type="number"
                    value={Math.round(selectedOverlay.x)}
                    onChange={(e) =>
                      onUpdateOverlay({ ...selectedOverlay, x: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono">Tọa độ Y</span>
                  <input
                    type="number"
                    value={Math.round(selectedOverlay.y)}
                    onChange={(e) =>
                      onUpdateOverlay({ ...selectedOverlay, y: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    );
  }

  if (!hole) {
    return (
      <aside className="w-72 border-l border-slate-200 bg-white p-5 flex flex-col items-center justify-center text-center select-none text-slate-400 z-10 shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
          <Sliders className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-slate-700 mb-1">
          Chưa chọn đối tượng nào
        </p>
        <p className="text-[11px] leading-relaxed text-slate-400 max-w-[200px]">
          Nhấp vào ô lỗ ảnh hoặc chữ/logo/sticker trên khung để chỉnh sửa thông số.
        </p>
      </aside>
    );
  }

  // Unit conversion helpers (assuming standard dimensions.dpi)
  const dpi = dimensions.dpi || 300;
  const toUnit = (pxVal: number) => {
    if (unit === 'mm') return (pxVal / dpi) * 25.4;
    if (unit === 'in') return pxVal / dpi;
    return pxVal;
  };
  const fromUnit = (val: number) => {
    if (unit === 'mm') return (val / 25.4) * dpi;
    if (unit === 'in') return val * dpi;
    return val;
  };

  const handleRatioLock = (ratio: number) => {
    const newHeight = Math.round(hole.width / ratio);
    onUpdateHole({ ...hole, height: newHeight });
  };

  const handleCopyPhotoboothCode = () => {
    const json = JSON.stringify(
      allHoles.map((h) => ({
        slot: h.order,
        x: Math.round(h.x),
        y: Math.round(h.y),
        width: Math.round(h.width),
        height: Math.round(h.height),
        shape: h.type,
      })),
      null,
      2
    );
    navigator.clipboard.writeText(json);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <aside className="w-72 border-l border-slate-200 bg-white flex flex-col h-full select-none z-10 shrink-0 overflow-y-auto">
      {/* Header with Slot Badge */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
            #{hole.order}
          </span>
          <span className="font-bold text-xs text-slate-800">
            Thông Số Lỗ Đục
          </span>
        </div>

        {/* Unit switcher */}
        <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
          {(['px', 'mm', 'in'] as const).map((u) => (
            <button
              key={u}
              id={`unit-btn-${u}`}
              onClick={() => setUnit(u)}
              className={`px-1.5 py-0.5 rounded ${
                unit === u ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Shape Types */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Hình Dạng Lỗ Trống
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              id="shape-btn-rect"
              onClick={() => onUpdateHole({ ...hole, type: 'rect' })}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                hole.type === 'rect'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Square className="w-4 h-4" />
              <span className="text-[10px]">Chữ Nhật</span>
            </button>

            <button
              id="shape-btn-rounded"
              onClick={() =>
                onUpdateHole({
                  ...hole,
                  type: 'rounded',
                  borderRadius: hole.borderRadius || 16,
                })
              }
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                hole.type === 'rounded'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className="w-4 h-4 rounded border-2 border-current" />
              <span className="text-[10px]">Bo Góc</span>
            </button>

            <button
              id="shape-btn-circle"
              onClick={() => onUpdateHole({ ...hole, type: 'circle' })}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                hole.type === 'circle'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Circle className="w-4 h-4" />
              <span className="text-[10px]">Hình Tròn</span>
            </button>
          </div>
        </div>

        {/* Rounded Corner Slider if rounded */}
        {hole.type === 'rounded' && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-600 font-medium">Bán kính bo góc:</span>
              <span className="font-bold text-slate-800 font-mono">
                {hole.borderRadius} px
              </span>
            </div>
            <input
              id="input-border-radius"
              type="range"
              min="0"
              max={Math.floor(Math.min(hole.width, hole.height) / 2)}
              value={hole.borderRadius || 0}
              onChange={(e) =>
                onUpdateHole({ ...hole, borderRadius: Number(e.target.value) })
              }
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        )}

        {/* Coordinates X, Y, W, H */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Tọa Độ & Kích Thước ({unit})
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
              <span className="text-[10px] text-slate-400 block font-semibold">Tọa độ X</span>
              <input
                id="input-coord-x"
                type="number"
                step={unit === 'px' ? 1 : 0.1}
                value={Number(toUnit(hole.x).toFixed(1))}
                onChange={(e) =>
                  onUpdateHole({
                    ...hole,
                    x: Math.round(fromUnit(Number(e.target.value))),
                  })
                }
                className="w-full font-mono font-bold text-xs bg-transparent focus:outline-hidden text-slate-800"
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
              <span className="text-[10px] text-slate-400 block font-semibold">Tọa độ Y</span>
              <input
                id="input-coord-y"
                type="number"
                step={unit === 'px' ? 1 : 0.1}
                value={Number(toUnit(hole.y).toFixed(1))}
                onChange={(e) =>
                  onUpdateHole({
                    ...hole,
                    y: Math.round(fromUnit(Number(e.target.value))),
                  })
                }
                className="w-full font-mono font-bold text-xs bg-transparent focus:outline-hidden text-slate-800"
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
              <span className="text-[10px] text-slate-400 block font-semibold">Chiều Rộng (W)</span>
              <input
                id="input-coord-w"
                type="number"
                step={unit === 'px' ? 1 : 0.1}
                value={Number(toUnit(hole.width).toFixed(1))}
                onChange={(e) =>
                  onUpdateHole({
                    ...hole,
                    width: Math.max(20, Math.round(fromUnit(Number(e.target.value)))),
                  })
                }
                className="w-full font-mono font-bold text-xs bg-transparent focus:outline-hidden text-slate-800"
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
              <span className="text-[10px] text-slate-400 block font-semibold">Chiều Cao (H)</span>
              <input
                id="input-coord-h"
                type="number"
                step={unit === 'px' ? 1 : 0.1}
                value={Number(toUnit(hole.height).toFixed(1))}
                onChange={(e) =>
                  onUpdateHole({
                    ...hole,
                    height: Math.max(20, Math.round(fromUnit(Number(e.target.value)))),
                  })
                }
                className="w-full font-mono font-bold text-xs bg-transparent focus:outline-hidden text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Camera Aspect Ratio Presets */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Tỉ Lệ Ảnh Máy Ảnh
          </label>
          <div className="grid grid-cols-4 gap-1">
            <button
              id="btn-ratio-3-2"
              onClick={() => handleRatioLock(3 / 2)}
              className="py-1.5 px-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-mono font-semibold text-slate-700 text-center"
              title="Tỉ lệ 3:2 (Chuẩn máy ảnh DSLR Canon/Nikon/Sony)"
            >
              3:2 DSLR
            </button>
            <button
              id="btn-ratio-4-3"
              onClick={() => handleRatioLock(4 / 3)}
              className="py-1.5 px-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-mono font-semibold text-slate-700 text-center"
              title="Tỉ lệ 4:3 (iPad / Webcam photobooth)"
            >
              4:3 iPad
            </button>
            <button
              id="btn-ratio-1-1"
              onClick={() => handleRatioLock(1)}
              className="py-1.5 px-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-mono font-semibold text-slate-700 text-center"
              title="Tỉ lệ 1:1 Vuông"
            >
              1:1 Vuông
            </button>
            <button
              id="btn-ratio-16-9"
              onClick={() => handleRatioLock(16 / 9)}
              className="py-1.5 px-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-mono font-semibold text-slate-700 text-center"
              title="Tỉ lệ 16:9 Màn rộng"
            >
              16:9
            </button>
          </div>
        </div>

        {/* Alignments */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Căn Chỉnh Vị Trí
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              id="align-btn-ch"
              onClick={() => onAlignHoles('center-h')}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-700"
              title="Căn giữa ngang trên khung"
            >
              <AlignCenterHorizontal className="w-4 h-4" />
            </button>
            <button
              id="align-btn-cv"
              onClick={() => onAlignHoles('center-v')}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-700"
              title="Căn giữa dọc trên khung"
            >
              <AlignCenterVertical className="w-4 h-4" />
            </button>
            <button
              id="align-btn-left"
              onClick={() => onAlignHoles('left')}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-700"
              title="Căn mép trái"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              id="align-btn-right"
              onClick={() => onAlignHoles('right')}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-700"
              title="Căn mép phải"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-1.5">
            <button
              id="align-btn-top"
              onClick={() => onAlignHoles('top')}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-700"
              title="Căn mép trên"
            >
              <ArrowUpToLine className="w-4 h-4" />
            </button>
            <button
              id="align-btn-bottom"
              onClick={() => onAlignHoles('bottom')}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-700"
              title="Căn mép dưới"
            >
              <ArrowDownToLine className="w-4 h-4" />
            </button>
            <button
              id="align-btn-distribute-v"
              onClick={() => onAlignHoles('distribute-v')}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-700 text-[10px] font-bold"
              title="Giãn cách đều các lỗ theo chiều dọc"
            >
              Chia Đều Dọc
            </button>
          </div>
        </div>

        {/* Quick Actions for Selected Hole */}
        <div className="pt-2 border-t border-slate-100 flex gap-2">
          <button
            id="btn-duplicate-hole"
            onClick={() => onDuplicateHole(hole.id)}
            className="flex-1 py-2 px-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            Nhân bản
          </button>
          <button
            id="btn-delete-hole-prop"
            onClick={() => onDeleteHole(hole.id)}
            className="py-2 px-3 rounded-lg border border-red-200 text-red-600 font-semibold text-xs hover:bg-red-50 flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa
          </button>
        </div>

        {/* Export DSLRBooth / Breeze coordinates */}
        <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-900 flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-indigo-600" />
              Tọa độ Photobooth Layout
            </span>
          </div>
          <p className="text-[10px] text-indigo-700 leading-normal">
            Dùng để dán trực tiếp vào cấu hình layout DSLRBooth, Breeze hoặc Touchpix.
          </p>
          <button
            id="btn-copy-layout-json"
            onClick={handleCopyPhotoboothCode}
            className="w-full py-1.5 px-2.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-50 transition-colors"
          >
            {copiedCode ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                Đã sao chép JSON!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Sao chép tọa độ JSON
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
