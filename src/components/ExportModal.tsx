import React, { useState } from 'react';
import {
  X,
  FileDown,
  FileImage,
  Printer,
  Check,
  Download,
  Scissors,
  Copy,
  Sparkles,
  Layers,
  Sliders,
  Zap,
} from 'lucide-react';
import { ExportSettings, FrameDimensions, HoleItem, OverlayItem } from '../types';
import {
  exportPhotoboothPDF,
  exportTwinStrips4x6PDF,
  triggerFileDownload,
} from '../utils/pdfExport';
import { createPunchedFrameCanvas } from '../utils/canvasPuncher';

interface ExportModalProps {
  isOpen: boolean;
  frameCanvas: HTMLCanvasElement | null;
  holes: HoleItem[];
  overlays?: OverlayItem[];
  dimensions: FrameDimensions;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  frameCanvas,
  holes,
  overlays = [],
  dimensions,
  onClose,
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'pdf',
    dpi: dimensions.dpi >= 600 ? dimensions.dpi : 600, // Default to 600 DPI for ultra print quality
    paperSize: 'fit_frame',
    includeCutMarks: true,
    includeSlotNumbers: false,
    bleedMm: 2,
    pdfTitle: 'Photobooth_Cutout_Frame',
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [customDpiMode, setCustomDpiMode] = useState(false);

  if (!isOpen || !frameCanvas) return null;

  const isStrip = dimensions.physicalWidthInch === 2 && dimensions.physicalHeightInch === 6;
  const baseDpi = dimensions.dpi || 300;
  const currentDpi = settings.dpi || 300;
  const scale = currentDpi / baseDpi;
  const outputWidthPx = Math.round(dimensions.widthPx * scale);
  const outputHeightPx = Math.round(dimensions.heightPx * scale);
  const physicalWcm = (dimensions.physicalWidthInch * 2.54).toFixed(1);
  const physicalHcm = (dimensions.physicalHeightInch * 2.54).toFixed(1);

  // Handler for exporting PDF
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const pdfBytes = await exportPhotoboothPDF(
        frameCanvas,
        holes,
        dimensions,
        settings,
        overlays
      );
      triggerFileDownload(
        pdfBytes,
        `${settings.pdfTitle || 'photobooth_frame'}_${currentDpi}dpi.pdf`,
        'application/pdf'
      );
      setExportSuccess(`Đã xuất file PDF đục lỗ chất lượng ${currentDpi} DPI thành công!`);
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi tạo file PDF. Vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  // Handler for twin 2x6 strip on 4x6 print paper
  const handleExportTwinStripPDF = async () => {
    setIsExporting(true);
    try {
      const pdfBytes = await exportTwinStrips4x6PDF(
        frameCanvas,
        holes,
        settings,
        overlays,
        dimensions
      );
      triggerFileDownload(
        pdfBytes,
        `${settings.pdfTitle || 'photobooth_strip'}_twin_4x6_${currentDpi}dpi.pdf`,
        'application/pdf'
      );
      setExportSuccess(`Đã xuất file PDF 2 dải in trên 4x6" (${currentDpi} DPI) thành công!`);
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi tạo file PDF. Vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  // Handler for exporting Transparent PNG Overlay
  const handleExportPNG = () => {
    setIsExporting(true);
    try {
      const scaleFactor = Math.max(0.2, currentDpi / baseDpi);
      const punched = createPunchedFrameCanvas(frameCanvas, holes, {
        overlays,
        scaleFactor,
      });
      punched.toBlob((blob) => {
        if (blob) {
          triggerFileDownload(
            blob,
            `${settings.pdfTitle || 'photobooth_overlay'}_${currentDpi}dpi_transparent.png`,
            'image/png'
          );
          setExportSuccess(`Đã xuất file PNG trong suốt (${currentDpi} DPI - ${outputWidthPx}×${outputHeightPx}px) thành công!`);
          setTimeout(() => setExportSuccess(null), 3000);
        }
        setIsExporting(false);
      }, 'image/png');
    } catch (err) {
      console.error(err);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>Xuất File Frame Đục Lỗ Photobooth</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                  {currentDpi} DPI
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Tạo file PDF chuẩn in ấn cao cấp & PNG overlay trong suốt cho phần mềm photobooth
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

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* File Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên file xuất:
            </label>
            <input
              type="text"
              value={settings.pdfTitle}
              onChange={(e) => setSettings({ ...settings, pdfTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:border-indigo-500 focus:outline-hidden"
              placeholder="VD: Photobooth_DamCuoi_2x6"
            />
          </div>

          {/* DPI SELECTION - QUALITY ENHANCEMENT */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-slate-50 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <label className="text-xs font-bold text-indigo-950">
                  Chất Lượng In & Độ Phân Giải (DPI):
                </label>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white font-mono">
                {currentDpi} DPI {currentDpi >= 600 ? '• Siêu Nét Ultra HD' : currentDpi >= 400 ? '• Nét Cao Pro' : '• Chuẩn Lab'}
              </span>
            </div>

            {/* DPI Options Grid */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSettings({ ...settings, dpi: 300 });
                  setCustomDpiMode(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  settings.dpi === 300 && !customDpiMode
                    ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-xs text-indigo-900'
                    : 'border-slate-200 bg-white/70 hover:bg-white text-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>300 DPI</span>
                  {settings.dpi === 300 && !customDpiMode && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Chuẩn Lab / In nhanh</div>
                <div className="text-[9px] font-mono text-slate-400 mt-1">
                  {Math.round(dimensions.widthPx * (300 / baseDpi))}×{Math.round(dimensions.heightPx * (300 / baseDpi))} px
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSettings({ ...settings, dpi: 450 });
                  setCustomDpiMode(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  settings.dpi === 450 && !customDpiMode
                    ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-xs text-indigo-900'
                    : 'border-slate-200 bg-white/70 hover:bg-white text-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>450 DPI</span>
                  {settings.dpi === 450 && !customDpiMode && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Sắc nét cao Pro HD</div>
                <div className="text-[9px] font-mono text-slate-400 mt-1">
                  {Math.round(dimensions.widthPx * (450 / baseDpi))}×{Math.round(dimensions.heightPx * (450 / baseDpi))} px
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSettings({ ...settings, dpi: 600 });
                  setCustomDpiMode(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  settings.dpi === 600 && !customDpiMode
                    ? 'border-purple-600 bg-white ring-2 ring-purple-500/20 shadow-xs text-purple-950'
                    : 'border-slate-200 bg-white/70 hover:bg-white text-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    600 DPI
                    <span className="text-[8px] px-1 py-0.2 rounded bg-purple-100 text-purple-700 font-extrabold">
                      TOP
                    </span>
                  </span>
                  {settings.dpi === 600 && !customDpiMode && <Check className="w-3.5 h-3.5 text-purple-600" />}
                </div>
                <div className="text-[10px] text-purple-800 font-medium mt-0.5">Siêu Nét Ultra HD</div>
                <div className="text-[9px] font-mono text-purple-600 font-bold mt-1">
                  {Math.round(dimensions.widthPx * (600 / baseDpi))}×{Math.round(dimensions.heightPx * (600 / baseDpi))} px
                </div>
              </button>
            </div>

            {/* Custom DPI toggle / input */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={() => setCustomDpiMode(!customDpiMode)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Sliders className="w-3 h-3" />
                <span>{customDpiMode ? 'Thu gọn tùy chỉnh' : 'Tùy chỉnh số DPI khác (150 - 1200 DPI)...'}</span>
              </button>
              {customDpiMode && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="150"
                    max="1200"
                    step="50"
                    value={settings.dpi}
                    onChange={(e) => setSettings({ ...settings, dpi: Math.max(72, Math.min(1200, Number(e.target.value) || 300)) })}
                    className="w-20 px-2 py-1 bg-white border border-indigo-300 rounded-lg text-xs font-mono font-bold text-slate-800 text-center"
                  />
                  <span className="text-[11px] text-slate-500 font-bold">DPI</span>
                </div>
              )}
            </div>

            {/* Real-time Resolution Info Card */}
            <div className="p-2.5 bg-white/90 rounded-lg border border-indigo-100 flex items-center justify-between text-[11px]">
              <div>
                <span className="text-slate-500">Độ phân giải file xuất:</span>
                <span className="font-bold text-slate-800 font-mono ml-1.5">
                  {outputWidthPx} × {outputHeightPx} px
                </span>
              </div>
              <div>
                <span className="text-slate-500">Khổ in thực tế:</span>
                <span className="font-semibold text-slate-800 ml-1.5 font-mono">
                  {dimensions.physicalWidthInch}"×{dimensions.physicalHeightInch}" ({physicalWcm}×{physicalHcm} cm)
                </span>
              </div>
            </div>
          </div>

          {/* Paper Size & Layout */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Khổ giấy xuất PDF:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, paperSize: 'fit_frame' })}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  settings.paperSize === 'fit_frame'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 font-semibold text-indigo-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Chuẩn tỷ lệ khung</span>
                  <span className="text-[10px] font-mono font-bold text-indigo-600">
                    {currentDpi} DPI
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  {outputWidthPx} × {outputHeightPx} px ({dimensions.physicalWidthInch}"×{dimensions.physicalHeightInch}")
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, paperSize: '4x6' })}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  settings.paperSize === '4x6'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 font-semibold text-indigo-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold">Khổ 4x6" (10x15cm)</div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Chuẩn máy in nhiệt DNP / Citizen / Hiti
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, paperSize: 'A4' })}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  settings.paperSize === 'A4'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 font-semibold text-indigo-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Khổ A4 Dọc</span>
                  <span className="text-[9px] font-bold px-1 rounded bg-indigo-100 text-indigo-700">210×297mm</span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Chuẩn in màu văn phòng / in ảnh A4
                </p>
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700">
              Tùy chọn in & xén:
            </label>
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={settings.includeCutMarks}
                onChange={(e) =>
                  setSettings({ ...settings, includeCutMarks: e.target.checked })
                }
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-2 font-medium text-slate-700">
                <Scissors className="w-3.5 h-3.5 text-slate-500" />
                <span>Thêm vạch dấu cắt xén (Crop Marks) ở 4 góc</span>
              </div>
            </label>
          </div>

          {/* Twin 2x6 special option if strip format */}
          {isStrip && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Printer className="w-4 h-4 text-amber-600" />
                <span>Khổ Dải 2x6": In 2 dải trên 1 tờ 4x6" ({currentDpi} DPI)</span>
              </div>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Máy in DNP/Hiti khi in cuộn 4x6" sẽ tự động cắt đôi thành 2 dải 2x6". Bạn có thể tải ngay file PDF ghép sẵn 2 dải song song ở độ phân giải cao {currentDpi} DPI kèm vạch cắt đôi!
              </p>
              <button
                type="button"
                onClick={handleExportTwinStripPDF}
                disabled={isExporting}
                className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Tải PDF 2 Dải 2x6 Ghép Khổ 4x6" ({currentDpi} DPI)
              </button>
            </div>
          )}

          {/* Success Banner */}
          {exportSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{exportSuccess}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleExportPNG}
            disabled={isExporting}
            className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors shadow-xs"
            title="Xuất file PNG có kênh alpha trong suốt dùng cho DSLRBooth, Breeze, Sparkbooth"
          >
            <FileImage className="w-4 h-4 text-indigo-600" />
            Tải PNG Trong Suốt ({currentDpi} DPI)
          </button>

          <button
            id="btn-confirm-export-pdf"
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-md shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Đang xuất PDF...' : `Tải File PDF Đục Lỗ (${currentDpi} DPI)`}
          </button>
        </div>
      </div>
    </div>
  );
};
