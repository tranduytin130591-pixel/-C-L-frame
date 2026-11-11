# Photobooth Frame Puncher

Công cụ đục lỗ trong suốt cho frame photobooth và xuất **PDF / PNG overlay** cho các phần mềm photobooth (DSLRBooth, Breeze…). Mọi xử lý đều chạy trên máy, không cần mạng (trừ ảnh mẫu xem thử).

## Tính năng

- Preset khổ in chuẩn: dải 2x6", 4x6", A4 (300 / 450 / 600 DPI)
- Tải frame thiết kế sẵn (PNG, JPG, WebP, SVG)
- Thêm lỗ chữ nhật / bo góc / tròn; tự xếp bố cục (3 ảnh, 4 ảnh, lưới 2×2…)
- **Đũa thần**: bấm vào ô ảnh trên frame để tự đục, đường cắt né sticker lấn vào ô
- Chữ, logo, sticker trang trí
- Undo / redo (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)
- Xuất PDF giữ đúng tỉ lệ, PNG trong suốt, PDF 2 dải 2x6 trên giấy 4x6

## Chạy bản web khi phát triển

Yêu cầu: Node.js 20+

```bash
npm install
npm run dev
```

Mở http://localhost:3000

## Chạy bản desktop khi phát triển

Chạy `npm run dev` ở một terminal, rồi ở terminal khác:

```bash
npm run electron:dev
```

## Đóng gói file .exe (Windows)

```bash
npm run dist:win
```

Kết quả nằm trong thư mục `release/`:

- `PhotoboothFramePuncher-Setup-<version>.exe`: bộ cài đặt (tạo shortcut Desktop / Start Menu)
- `PhotoboothFramePuncher-Portable-<version>.exe`: bản chạy ngay, không cần cài

## Cấu trúc

| Đường dẫn | Vai trò |
|---|---|
| `src/App.tsx` | State chính, undo/redo, phím tắt |
| `src/components/` | Giao diện: canvas, sidebar, bảng thuộc tính, modal xuất file |
| `src/utils/canvasPuncher.ts` | Đục lỗ, đũa thần (flood fill + dò viền) |
| `src/utils/pdfExport.ts` | Xuất PDF |
| `src/utils/layoutCalculator.ts` | Tự xếp bố cục |
| `electron/main.cjs` | Cửa sổ desktop Electron |
