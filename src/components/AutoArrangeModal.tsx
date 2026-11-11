import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  LayoutGrid,
  Check,
  Sliders,
  Maximize2,
  Square,
  Circle,
  HelpCircle,
  ArrowDownToLine,
  RefreshCw,
} from 'lucide-react';
import { FrameDimensions, HoleItem, HoleType } from '../types';
import {
  AVAILABLE_PATTERNS,
  AutoArrangeConfig,
  LayoutPatternId,
  calculateSmartHoles,
} from '../utils/layoutCalculator';
import { drawHolePath } from '../utils/canvasPuncher';

interface AutoArrangeModalProps {
  isOpen: boolean;
  frameCanvas: HTMLCanvasElement | null;
  dimensions: FrameDimensions;
  onClose: () => void;
  onApplyLayout: (newHoles: HoleItem[]) => void;
}

export const AutoArrangeModal: React.FC<AutoArrangeModalProps> = ({
  isOpen,
  frameCanvas,
  dimensions,
  onClose,
  onApplyLayout,
}) => {
  const isStrip = dimensions.physicalWidthInch === 2 || dimensions.widthPx < dimensions.heightPx * 0.5;

  const [config, setConfig] = useState<AutoArrangeConfig>({
    pattern: isStrip ? 'strip-3' : 'grid-2x2',
    aspectRatio: 3 / 2, // 1.5 standard DSLR
    holeType: 'rounded',
    borderRadius: 14,
    marginPercent: isStrip ? 8 : 6,
    bottomExtraMarginPercent: 6, // extra bottom space for photobooth branding
    gapPx: isStrip ? 24 : 32,
  });

  // Calculate live preview holes
  const previewHoles = useMemo(() => {
    return calculateSmartHoles(dimensions.widthPx, dimensions.heightPx, config);
  }, [dimensions, config]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyLayout(previewHoles);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs select-none">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Tự Động Xếp Lỗ Đục Thông Minh
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  Smart Layout
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Tự tính toán vị trí, kích thước và đối xứng hoàn hảo dựa theo kích thước khung của bạn ({dimensions.widthPx} × {dimensions.heightPx} px)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Two Columns */}
        <div className="flex-1 overflow-hidden grid grid-cols-12 divide-x divide-slate-200">
          {/* Left Column: Pattern & Parameter Controls */}
          <div className="col-span-7 p-5 overflow-y-auto space-y-5">
            {/* Pattern Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Chọn Kiểu Bố Cục Có Sẵn
                </label>
                <span className="text-[11px] text-indigo-600 font-semibold">
                  {AVAILABLE_PATTERNS.find((p) => p.id === config.pattern)?.nameVi}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {AVAILABLE_PATTERNS.map((pat) => {
                  const isSelected = config.pattern === pat.id;
                  return (
                    <button
                      key={pat.id}
                      id={`auto-pattern-${pat.id}`}
                      type="button"
                      onClick={() => setConfig({ ...config, pattern: pat.id })}
                      className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          {pat.nameVi}
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-md bg-slate-200/70 text-[10px] font-bold text-slate-700 font-mono">
                          {pat.photoCount} ảnh
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 leading-snug">
                        {pat.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shape and Camera Aspect Ratio */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Tỉ Lệ Ảnh Máy Ảnh
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, aspectRatio: 3 / 2 })}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      config.aspectRatio === 3 / 2
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    3:2 (DSLR)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, aspectRatio: 4 / 3 })}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      config.aspectRatio === 4 / 3
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    4:3 (iPad)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, aspectRatio: 1 })}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      config.aspectRatio === 1
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    1:1 (Vuông)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, aspectRatio: 'fit' })}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      config.aspectRatio === 'fit'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Vừa khít (Fit)
                  </button>
                </div>
              </div>

              {/* Hole Shape */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  3. Kiểu Dáng Lỗ Trống
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, holeType: 'rect' })}
                    className={`p-1.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      config.holeType === 'rect'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Vuông</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, holeType: 'rounded' })}
                    className={`p-1.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      config.holeType === 'rounded'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded border-2 border-current" />
                    <span className="text-[10px]">Bo góc</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, holeType: 'circle' })}
                    className={`p-1.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      config.holeType === 'circle'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Circle className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Tròn</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Fine-Tuning Sliders */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                4. Tinh Chỉnh Khoảng Cách & Lề Khung
              </label>

              {/* Corner Radius if rounded */}
              {config.holeType === 'rounded' && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-700">
                    <span className="font-semibold">Bán kính bo góc:</span>
                    <span className="font-mono font-bold text-indigo-600">{config.borderRadius} px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="40"
                    value={config.borderRadius}
                    onChange={(e) => setConfig({ ...config, borderRadius: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              )}

              {/* Outer Margin */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-700">
                  <span className="font-semibold">Lề viền khung (Margin):</span>
                  <span className="font-mono font-bold text-indigo-600">{config.marginPercent}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="18"
                  value={config.marginPercent}
                  onChange={(e) => setConfig({ ...config, marginPercent: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Bottom Extra Margin */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-700">
                  <span className="font-semibold flex items-center gap-1">
                    <ArrowDownToLine className="w-3.5 h-3.5 text-slate-500" />
                    Chừa thêm lề đáy (In logo/chữ ký photobooth):
                  </span>
                  <span className="font-mono font-bold text-indigo-600">+{config.bottomExtraMarginPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="22"
                  value={config.bottomExtraMarginPercent}
                  onChange={(e) =>
                    setConfig({ ...config, bottomExtraMarginPercent: Number(e.target.value) })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Gap between holes */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-700">
                  <span className="font-semibold">Khoảng cách giữa các ô ảnh (Gap):</span>
                  <span className="font-mono font-bold text-indigo-600">{config.gapPx} px</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="64"
                  step="2"
                  value={config.gapPx}
                  onChange={(e) => setConfig({ ...config, gapPx: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Visual Frame Preview with Scrolling */}
          <div className="col-span-5 bg-slate-100/80 p-5 flex flex-col items-center justify-between overflow-hidden">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Xem Trước Bố Cục ({previewHoles.length} Ô Ảnh)
              </span>
              <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span>↕ Cuộn xem khung</span>
              </span>
            </div>

            {/* Scrollable Preview Container */}
            <div className="flex-1 w-full overflow-y-auto overflow-x-hidden p-4 flex justify-center items-start rounded-2xl bg-slate-200/60 border border-slate-300/80 shadow-inner max-h-[420px]">
              {(() => {
                // Determine preview width
                const targetW = isStrip ? 160 : 250;
                const targetH = (targetW * dimensions.heightPx) / dimensions.widthPx;
                const scaleX = targetW / dimensions.widthPx;
                const scaleY = targetH / dimensions.heightPx;

                return (
                  <div
                    className="relative bg-white shadow-xl rounded-sm border border-slate-300 overflow-hidden checkerboard-bg my-auto shrink-0 transition-all"
                    style={{
                      width: targetW,
                      height: targetH,
                    }}
                  >
                    {/* Simulated frame graphic */}
                    {frameCanvas && (
                      <img
                        src={frameCanvas.toDataURL()}
                        alt="Frame preview"
                        className="absolute inset-0 w-full h-full object-fill opacity-90 pointer-events-none"
                      />
                    )}

                    {/* Overlaid preview holes */}
                    {previewHoles.map((h, i) => {
                      return (
                        <div
                          key={h.id || i}
                          className="absolute border-2 border-indigo-600 bg-white/75 backdrop-blur-2xs flex items-center justify-center font-bold text-indigo-900 shadow-sm"
                          style={{
                            left: h.x * scaleX,
                            top: h.y * scaleY,
                            width: h.width * scaleX,
                            height: h.height * scaleY,
                            borderRadius:
                              h.type === 'circle'
                                ? '9999px'
                                : `${(h.borderRadius || 0) * scaleX}px`,
                          }}
                        >
                          <span className="text-[10px] bg-indigo-600 text-white w-4 h-4 rounded-full flex items-center justify-center font-mono shadow-xs">
                            {h.order}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Readout stats */}
            <div className="w-full bg-white rounded-xl p-3 border border-slate-200 text-xs space-y-1 mt-3">
              <div className="flex justify-between text-slate-600">
                <span>Kích thước mỗi ô ảnh:</span>
                <span className="font-mono font-bold text-slate-900">
                  {previewHoles[0] ? `${previewHoles[0].width} × ${previewHoles[0].height} px` : '---'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tọa độ bắt đầu:</span>
                <span className="font-mono text-slate-700">
                  {previewHoles[0] ? `X: ${previewHoles[0].x}, Y: ${previewHoles[0].y}` : '---'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            * Nhấn Áp Dụng sẽ thay thế các lỗ hiện tại bằng bố cục đã tính toán đối xứng.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              id="btn-confirm-apply-auto-arrange"
              type="button"
              onClick={handleApply}
              className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
            >
              <Check className="w-4 h-4" />
              Áp Dụng Bố Cục ({previewHoles.length} Lỗ)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
