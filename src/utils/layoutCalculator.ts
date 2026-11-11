import { HoleItem, HoleType } from '../types';

export type LayoutPatternId =
  | 'strip-3'
  | 'strip-4'
  | 'grid-2x2'
  | 'strip-2'
  | 'row-2'
  | 'asym-top-bottom'
  | 'polaroid-1'
  | 'grid-2x3';

export interface AutoArrangeConfig {
  pattern: LayoutPatternId;
  aspectRatio: number | 'fit'; // 3/2 (1.5), 4/3 (1.333), 1 (1.0), or 'fit'
  holeType: HoleType;
  borderRadius: number;
  marginPercent: number; // 0% - 20%
  bottomExtraMarginPercent: number; // extra space at bottom for event logo/dates (0% - 25%)
  gapPx: number; // spacing between holes
}

export interface PatternMeta {
  id: LayoutPatternId;
  nameVi: string;
  nameEn: string;
  description: string;
  recommendedFor: '2x6' | '4x6' | 'all';
  photoCount: number;
  iconType: string;
}

export const AVAILABLE_PATTERNS: PatternMeta[] = [
  {
    id: 'strip-3',
    nameVi: '3 Ảnh Dọc (Cổ Điển)',
    nameEn: '3 Photos Strip',
    description: 'Bố cục chuẩn nhất cho dải photobooth 2x6" với 3 khoảnh khắc',
    recommendedFor: '2x6',
    photoCount: 3,
    iconType: 'strip3',
  },
  {
    id: 'strip-4',
    nameVi: '4 Ảnh Dọc (Life 4 Cuts)',
    nameEn: '4 Photos Strip',
    description: 'Phong cách photobooth Hàn Quốc hot trend 4 ảnh dọc liên tiếp',
    recommendedFor: '2x6',
    photoCount: 4,
    iconType: 'strip4',
  },
  {
    id: 'grid-2x2',
    nameVi: 'Lưới 4 Ảnh 2×2',
    nameEn: '2x2 Grid',
    description: 'Bố cục 4 ảnh cân đối đối xứng tuyệt đẹp cho khổ 4x6" hoặc vuông',
    recommendedFor: '4x6',
    photoCount: 4,
    iconType: 'grid2x2',
  },
  {
    id: 'strip-2',
    nameVi: '2 Ảnh Dọc Lớn',
    nameEn: '2 Photos Vertical',
    description: '2 ảnh kích thước lớn tạo cảm giác sang trọng, thoáng đãng',
    recommendedFor: 'all',
    photoCount: 2,
    iconType: 'strip2',
  },
  {
    id: 'row-2',
    nameVi: '2 Ảnh Ngang Song Song',
    nameEn: '2 Photos Horizontal',
    description: '2 ảnh đặt cạnh nhau theo chiều ngang cho khung ngang 4x6"',
    recommendedFor: '4x6',
    photoCount: 2,
    iconType: 'row2',
  },
  {
    id: 'asym-top-bottom',
    nameVi: '3 Ảnh Tạp Chí (1 To + 2 Nhỏ)',
    nameEn: '1 Large + 2 Small',
    description: '1 ảnh lớn tiêu điểm ở trên và 2 ảnh nhỏ phụ ở bên dưới',
    recommendedFor: '4x6',
    photoCount: 3,
    iconType: 'asym',
  },
  {
    id: 'polaroid-1',
    nameVi: '1 Ảnh Polaroid Tiêu Điểm',
    nameEn: '1 Large Polaroid',
    description: '1 ảnh lớn trung tâm chừa lề đáy rộng cho logo, ngày cưới, lời chúc',
    recommendedFor: 'all',
    photoCount: 1,
    iconType: 'polaroid',
  },
  {
    id: 'grid-2x3',
    nameVi: 'Lưới 6 Ảnh Mini (2×3)',
    nameEn: '6 Photos Mini Grid',
    description: 'Lưu giữ nhiều biểu cảm với 6 ô ảnh nhỏ gọn (2 cột x 3 dòng)',
    recommendedFor: '4x6',
    photoCount: 6,
    iconType: 'grid2x3',
  },
];

/**
 * Mathematically calculates optimal, symmetric hole positions tailored to the frame
 */
export function calculateSmartHoles(
  frameW: number,
  frameH: number,
  config: AutoArrangeConfig
): HoleItem[] {
  const marginBase = Math.round(frameW * (config.marginPercent / 100));
  const marginLeft = marginBase;
  const marginRight = marginBase;
  const marginTop = Math.round(frameH * (config.marginPercent / 100));
  const marginBottom =
    Math.round(frameH * (config.marginPercent / 100)) +
    Math.round(frameH * (config.bottomExtraMarginPercent / 100));

  const contentW = frameW - marginLeft - marginRight;
  const contentH = frameH - marginTop - marginBottom;
  const gap = config.gapPx;

  const holes: HoleItem[] = [];

  const createHole = (
    order: number,
    x: number,
    y: number,
    w: number,
    h: number
  ): HoleItem => ({
    id: `hole-auto-${Date.now()}-${order}`,
    order,
    type: config.holeType,
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(w),
    height: Math.round(h),
    rotation: 0,
    borderRadius:
      config.holeType === 'circle'
        ? Math.round(Math.min(w, h) / 2)
        : config.holeType === 'rounded'
        ? config.borderRadius
        : 0,
  });

  if (config.pattern === 'strip-3' || config.pattern === 'strip-4' || config.pattern === 'strip-2') {
    const count = config.pattern === 'strip-3' ? 3 : config.pattern === 'strip-4' ? 4 : 2;
    const totalGaps = (count - 1) * gap;
    const maxAvailableH = (contentH - totalGaps) / count;

    let slotW = contentW;
    let slotH = maxAvailableH;

    if (config.aspectRatio !== 'fit') {
      const ar = config.aspectRatio; // w / h
      // Try width first
      const testH = slotW / ar;
      if (testH * count + totalGaps <= contentH) {
        slotH = testH;
      } else {
        slotH = maxAvailableH;
        slotW = slotH * ar;
      }
    }

    const totalUsedH = count * slotH + totalGaps;
    const startY = marginTop + (contentH - totalUsedH) / 2;
    const startX = marginLeft + (contentW - slotW) / 2;

    for (let i = 0; i < count; i++) {
      holes.push(
        createHole(i + 1, startX, startY + i * (slotH + gap), slotW, slotH)
      );
    }
  } else if (config.pattern === 'grid-2x2') {
    const cols = 2;
    const rows = 2;
    const maxW = (contentW - gap) / cols;
    const maxH = (contentH - gap) / rows;

    let slotW = maxW;
    let slotH = maxH;

    if (config.aspectRatio !== 'fit') {
      const ar = config.aspectRatio;
      const testH = slotW / ar;
      if (testH <= maxH) {
        slotH = testH;
      } else {
        slotH = maxH;
        slotW = slotH * ar;
      }
    }

    const totalUsedW = cols * slotW + gap;
    const totalUsedH = rows * slotH + gap;
    const startX = marginLeft + (contentW - totalUsedW) / 2;
    const startY = marginTop + (contentH - totalUsedH) / 2;

    let order = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        holes.push(
          createHole(
            order++,
            startX + c * (slotW + gap),
            startY + r * (slotH + gap),
            slotW,
            slotH
          )
        );
      }
    }
  } else if (config.pattern === 'row-2') {
    const cols = 2;
    const maxW = (contentW - gap) / cols;
    const maxH = contentH;

    let slotW = maxW;
    let slotH = maxH;

    if (config.aspectRatio !== 'fit') {
      const ar = config.aspectRatio;
      const testH = slotW / ar;
      if (testH <= maxH) {
        slotH = testH;
      } else {
        slotH = maxH;
        slotW = slotH * ar;
      }
    }

    const totalUsedW = cols * slotW + gap;
    const startX = marginLeft + (contentW - totalUsedW) / 2;
    const startY = marginTop + (contentH - slotH) / 2;

    for (let c = 0; c < cols; c++) {
      holes.push(
        createHole(c + 1, startX + c * (slotW + gap), startY, slotW, slotH)
      );
    }
  } else if (config.pattern === 'asym-top-bottom') {
    // 1 big on top, 2 small on bottom
    // Distribute height: top takes approx 58%, bottom takes 42%
    const totalH = contentH - gap;
    let topH = Math.round(totalH * 0.58);
    let bottomH = totalH - topH;

    let topW = contentW;
    let bottomSlotW = (contentW - gap) / 2;

    if (config.aspectRatio !== 'fit') {
      const ar = config.aspectRatio;
      const testTopH = topW / ar;
      if (testTopH < totalH * 0.65) {
        topH = testTopH;
        bottomH = totalH - topH;
      }
      const testBottomH = bottomSlotW / ar;
      bottomH = Math.min(bottomH, testBottomH);
    }

    const totalUsedH = topH + gap + bottomH;
    const startY = marginTop + (contentH - totalUsedH) / 2;
    const startX = marginLeft;

    // Slot 1 (Large top)
    holes.push(createHole(1, startX, startY, topW, topH));

    // Slot 2 & 3 (Bottom row)
    const bottomY = startY + topH + gap;
    holes.push(createHole(2, startX, bottomY, bottomSlotW, bottomH));
    holes.push(createHole(3, startX + bottomSlotW + gap, bottomY, bottomSlotW, bottomH));
  } else if (config.pattern === 'polaroid-1') {
    // 1 Large centered polaroid photo
    let slotW = contentW;
    let slotH = contentH;

    if (config.aspectRatio !== 'fit') {
      const ar = config.aspectRatio;
      const testH = slotW / ar;
      if (testH <= contentH) {
        slotH = testH;
      } else {
        slotH = contentH;
        slotW = slotH * ar;
      }
    }

    const startX = marginLeft + (contentW - slotW) / 2;
    const startY = marginTop + (contentH - slotH) / 2;

    holes.push(createHole(1, startX, startY, slotW, slotH));
  } else if (config.pattern === 'grid-2x3') {
    const cols = 2;
    const rows = 3;
    const maxW = (contentW - gap) / cols;
    const maxH = (contentH - 2 * gap) / rows;

    let slotW = maxW;
    let slotH = maxH;

    if (config.aspectRatio !== 'fit') {
      const ar = config.aspectRatio;
      const testH = slotW / ar;
      if (testH <= maxH) {
        slotH = testH;
      } else {
        slotH = maxH;
        slotW = slotH * ar;
      }
    }

    const totalUsedW = cols * slotW + gap;
    const totalUsedH = rows * slotH + 2 * gap;
    const startX = marginLeft + (contentW - totalUsedW) / 2;
    const startY = marginTop + (contentH - totalUsedH) / 2;

    let order = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        holes.push(
          createHole(
            order++,
            startX + c * (slotW + gap),
            startY + r * (slotH + gap),
            slotW,
            slotH
          )
        );
      }
    }
  }

  return holes;
}
