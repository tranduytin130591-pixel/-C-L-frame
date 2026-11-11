import { LayoutPreset } from '../types';

export const STANDARD_PRESETS: LayoutPreset[] = [
  {
    id: 'strip-3-cut',
    name: 'Strip 2x6 (3 Photos)',
    nameVi: 'Dải 2x6" (3 ảnh dọc cổ điển)',
    description: 'Kích thước chuẩn máy in DNP/Hiti: 600 x 1800 px (300 DPI)',
    category: '2x6',
    frameDimensions: {
      widthPx: 600,
      heightPx: 1800,
      dpi: 300,
      name: '2x6 Inch Strip (50x152mm)',
      aspectRatio: '1:3',
      physicalWidthInch: 2,
      physicalHeightInch: 6,
    },
    defaultFrameStyle: 'retro',
    holes: [
      {
        order: 1,
        type: 'rect',
        x: 48,
        y: 110,
        width: 504,
        height: 380,
        rotation: 0,
        borderRadius: 8,
      },
      {
        order: 2,
        type: 'rect',
        x: 48,
        y: 540,
        width: 504,
        height: 380,
        rotation: 0,
        borderRadius: 8,
      },
      {
        order: 3,
        type: 'rect',
        x: 48,
        y: 970,
        width: 504,
        height: 380,
        rotation: 0,
        borderRadius: 8,
      },
    ],
  },
  {
    id: 'strip-4-cut-korean',
    name: 'Strip 2x6 (4 Photos Life4Cuts)',
    nameVi: 'Dải 2x6" (4 ảnh dọc Hàn Quốc)',
    description: 'Phong cách Life Four Cuts hot trend: 600 x 1800 px (300 DPI)',
    category: '2x6',
    frameDimensions: {
      widthPx: 600,
      heightPx: 1800,
      dpi: 300,
      name: '2x6 Inch Strip (50x152mm)',
      aspectRatio: '1:3',
      physicalWidthInch: 2,
      physicalHeightInch: 6,
    },
    defaultFrameStyle: 'korean',
    holes: [
      {
        order: 1,
        type: 'rect',
        x: 45,
        y: 80,
        width: 510,
        height: 340,
        rotation: 0,
        borderRadius: 4,
      },
      {
        order: 2,
        type: 'rect',
        x: 45,
        y: 450,
        width: 510,
        height: 340,
        rotation: 0,
        borderRadius: 4,
      },
      {
        order: 3,
        type: 'rect',
        x: 45,
        y: 820,
        width: 510,
        height: 340,
        rotation: 0,
        borderRadius: 4,
      },
      {
        order: 4,
        type: 'rect',
        x: 45,
        y: 1190,
        width: 510,
        height: 340,
        rotation: 0,
        borderRadius: 4,
      },
    ],
  },
  {
    id: 'postcard-4-grid',
    name: 'Postcard 4x6 (2x2 Grid)',
    nameVi: 'Khổ 4x6" Lưới 4 ảnh (10x15cm)',
    description: 'Kích thước bưu thiếp chuẩn: 1800 x 1200 px ngang (300 DPI)',
    category: '4x6',
    frameDimensions: {
      widthPx: 1800,
      heightPx: 1200,
      dpi: 300,
      name: '4x6 Inch Landscape (102x152mm)',
      aspectRatio: '3:2',
      physicalWidthInch: 6,
      physicalHeightInch: 4,
    },
    defaultFrameStyle: 'floral',
    holes: [
      {
        order: 1,
        type: 'rounded',
        x: 80,
        y: 90,
        width: 780,
        height: 480,
        rotation: 0,
        borderRadius: 16,
      },
      {
        order: 2,
        type: 'rounded',
        x: 940,
        y: 90,
        width: 780,
        height: 480,
        rotation: 0,
        borderRadius: 16,
      },
      {
        order: 3,
        type: 'rounded',
        x: 80,
        y: 620,
        width: 780,
        height: 480,
        rotation: 0,
        borderRadius: 16,
      },
      {
        order: 4,
        type: 'rounded',
        x: 940,
        y: 620,
        width: 780,
        height: 480,
        rotation: 0,
        borderRadius: 16,
      },
    ],
  },
  {
    id: 'postcard-1-polaroid',
    name: 'Postcard 4x6 (1 Photo Large)',
    nameVi: 'Khổ 4x6" 1 Ảnh Polaroid lớn',
    description: '1 Ảnh tiêu điểm nổi bật kèm thông điệp: 1200 x 1800 px đứng',
    category: '4x6',
    frameDimensions: {
      widthPx: 1200,
      heightPx: 1800,
      dpi: 300,
      name: '4x6 Inch Portrait (102x152mm)',
      aspectRatio: '2:3',
      physicalWidthInch: 4,
      physicalHeightInch: 6,
    },
    defaultFrameStyle: 'classic',
    holes: [
      {
        order: 1,
        type: 'rounded',
        x: 100,
        y: 120,
        width: 1000,
        height: 1250,
        rotation: 0,
        borderRadius: 20,
      },
    ],
  },
  {
    id: 'strip-3-circle',
    name: 'Strip 2x6 (3 Circle Holes)',
    nameVi: 'Dải 2x6" (3 lỗ tròn nghệ thuật)',
    description: 'Thiết kế lỗ tròn nghệ thuật đặc biệt cho đám cưới & sinh nhật',
    category: '2x6',
    frameDimensions: {
      widthPx: 600,
      heightPx: 1800,
      dpi: 300,
      name: '2x6 Inch Strip (50x152mm)',
      aspectRatio: '1:3',
      physicalWidthInch: 2,
      physicalHeightInch: 6,
    },
    defaultFrameStyle: 'floral',
    holes: [
      {
        order: 1,
        type: 'circle',
        x: 80,
        y: 120,
        width: 440,
        height: 440,
        rotation: 0,
        borderRadius: 220,
      },
      {
        order: 2,
        type: 'circle',
        x: 80,
        y: 600,
        width: 440,
        height: 440,
        rotation: 0,
        borderRadius: 220,
      },
      {
        order: 3,
        type: 'circle',
        x: 80,
        y: 1080,
        width: 440,
        height: 440,
        rotation: 0,
        borderRadius: 220,
      },
    ],
  },
  {
    id: 'a4-portrait-4-grid',
    name: 'A4 Portrait (4 Grid Photos)',
    nameVi: 'Khổ A4 Dọc (210×297mm - 4 ảnh lưới)',
    description: 'Khổ giấy in A4 chuẩn quốc tế: 2480 x 3508 px (300 DPI) - Lưới 4 ảnh lớn',
    category: 'a4',
    frameDimensions: {
      widthPx: 2480,
      heightPx: 3508,
      dpi: 300,
      name: 'A4 Portrait (210x297mm)',
      aspectRatio: '1:1.414',
      physicalWidthInch: 8.27,
      physicalHeightInch: 11.69,
    },
    defaultFrameStyle: 'classic',
    holes: [
      {
        order: 1,
        type: 'rounded',
        x: 180,
        y: 260,
        width: 1020,
        height: 1360,
        rotation: 0,
        borderRadius: 24,
      },
      {
        order: 2,
        type: 'rounded',
        x: 1280,
        y: 260,
        width: 1020,
        height: 1360,
        rotation: 0,
        borderRadius: 24,
      },
      {
        order: 3,
        type: 'rounded',
        x: 180,
        y: 1720,
        width: 1020,
        height: 1360,
        rotation: 0,
        borderRadius: 24,
      },
      {
        order: 4,
        type: 'rounded',
        x: 1280,
        y: 1720,
        width: 1020,
        height: 1360,
        rotation: 0,
        borderRadius: 24,
      },
    ],
  },
  {
    id: 'a4-portrait-3-vertical',
    name: 'A4 Portrait (3 Photos Vertical)',
    nameVi: 'Khổ A4 Dọc (3 ảnh phong cách Tạp chí)',
    description: 'Khổ A4 dọc 2480 x 3508 px (300 DPI) - 3 ảnh ngang xếp tầng sang trọng',
    category: 'a4',
    frameDimensions: {
      widthPx: 2480,
      heightPx: 3508,
      dpi: 300,
      name: 'A4 Portrait (210x297mm)',
      aspectRatio: '1:1.414',
      physicalWidthInch: 8.27,
      physicalHeightInch: 11.69,
    },
    defaultFrameStyle: 'floral',
    holes: [
      {
        order: 1,
        type: 'rounded',
        x: 190,
        y: 250,
        width: 2100,
        height: 880,
        rotation: 0,
        borderRadius: 20,
      },
      {
        order: 2,
        type: 'rounded',
        x: 190,
        y: 1210,
        width: 2100,
        height: 880,
        rotation: 0,
        borderRadius: 20,
      },
      {
        order: 3,
        type: 'rounded',
        x: 190,
        y: 2170,
        width: 2100,
        height: 880,
        rotation: 0,
        borderRadius: 20,
      },
    ],
  },
];

// Sample portrait photo placeholders with cheerful photobooth poses
export const SAMPLE_PORTRAITS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
];

// Generator for default decorative frame graphics when user tests without uploading
export function generateSampleFrameCanvas(
  style: 'floral' | 'retro' | 'neon' | 'korean' | 'classic',
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  if (style === 'korean') {
    // Pastel Korean Minimalist Life4Cuts frame
    ctx.fillStyle = '#EDE8F5';
    ctx.fillRect(0, 0, width, height);

    // Decorative subtle clouds or doodles
    ctx.fillStyle = '#D4CBE5';
    ctx.beginPath();
    ctx.arc(60, 50, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#E2D9F3';
    ctx.beginPath();
    ctx.arc(width - 50, height - 100, 120, 0, Math.PI * 2);
    ctx.fill();

    // Footer brand
    ctx.fillStyle = '#67527E';
    ctx.font = `bold ${Math.round(width * 0.05)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('• LIFE PHOTO BOOTH •', width / 2, height - 140);

    ctx.font = `${Math.round(width * 0.03)}px sans-serif`;
    ctx.fillStyle = '#8F7B9E';
    ctx.fillText('MEMORY OF TODAY  •  2026.09.10', width / 2, height - 90);
  } else if (style === 'retro') {
    // Retro film photobooth strip
    ctx.fillStyle = '#1C1917';
    ctx.fillRect(0, 0, width, height);

    // Film sprocket holes along side margins
    ctx.fillStyle = '#F5F5F4';
    const holeSize = Math.round(width * 0.035);
    const margin = Math.round(width * 0.02);
    for (let y = 30; y < height - 30; y += 45) {
      ctx.fillRect(margin, y, holeSize, holeSize * 1.4);
      ctx.fillRect(width - margin - holeSize, y, holeSize, holeSize * 1.4);
    }

    // Bottom label
    ctx.fillStyle = '#E7E5E4';
    ctx.font = `bold ${Math.round(width * 0.055)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('KODAK PORTRA 400', width / 2, height - 120);
    ctx.font = `${Math.round(width * 0.032)}px monospace`;
    ctx.fillStyle = '#A8A29E';
    ctx.fillText('35MM FILM PHOTOBOOTH', width / 2, height - 80);
  } else if (style === 'floral') {
    // Elegant wedding / event floral style
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#FAF6F0');
    grad.addColorStop(1, '#F3E9DF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Border line in rose gold
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    ctx.strokeStyle = '#E6CA65';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(38, 38, width - 76, height - 76);

    // Bottom text
    ctx.fillStyle = '#614B36';
    ctx.font = `italic 600 ${Math.round(width * 0.045)}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Happy Wedding Celebration', width / 2, height - 120);

    ctx.font = `${Math.round(width * 0.028)}px sans-serif`;
    ctx.fillStyle = '#8C735D';
    ctx.fillText('THANK YOU FOR CELEBRATING WITH US', width / 2, height - 75);
  } else if (style === 'neon') {
    // Dark Neon Nightclub style
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, width, height);

    // Cyber accent lines
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 4;
    ctx.strokeRect(25, 25, width - 50, height - 50);

    ctx.fillStyle = '#38BDF8';
    ctx.font = `bold ${Math.round(width * 0.05)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('NEON PARTY NIGHT', width / 2, height - 110);
  } else {
    // Classic Clean White / Slate
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.fillStyle = '#0F172A';
    ctx.font = `bold ${Math.round(width * 0.045)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('PHOTOBOOTH MOMENTS', width / 2, height - 100);
  }

  return canvas;
}

/**
 * Scales a preset's dimensions and hole coordinates to a target DPI (e.g. 300, 450, 600 DPI)
 */
export function getPresetWithDpi(preset: LayoutPreset, targetDpi: number): LayoutPreset {
  const baseDpi = preset.frameDimensions.dpi || 300;
  if (targetDpi === baseDpi) return preset;
  const scale = targetDpi / baseDpi;

  return {
    ...preset,
    frameDimensions: {
      ...preset.frameDimensions,
      widthPx: Math.round(preset.frameDimensions.widthPx * scale),
      heightPx: Math.round(preset.frameDimensions.heightPx * scale),
      dpi: targetDpi,
    },
    holes: preset.holes.map((h) => ({
      ...h,
      x: Math.round(h.x * scale),
      y: Math.round(h.y * scale),
      width: Math.round(h.width * scale),
      height: Math.round(h.height * scale),
      borderRadius: h.borderRadius ? Math.round(h.borderRadius * scale) : 0,
    })),
  };
}
