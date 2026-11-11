export interface StickerItemDef {
  code: string;
  nameVi: string;
  category: 'wedding' | 'party' | 'korean' | 'retro';
}

export const STICKER_COLLECTION: StickerItemDef[] = [
  // Wedding & Love
  { code: '💖', nameVi: 'Trái Tim Hồng', category: 'wedding' },
  { code: '💍', nameVi: 'Nhẫn Cưới', category: 'wedding' },
  { code: '👰', nameVi: 'Cô Dâu', category: 'wedding' },
  { code: '🤵', nameVi: 'Chú Rể', category: 'wedding' },
  { code: '💐', nameVi: 'Bó Hoa Cưới', category: 'wedding' },
  { code: '🕊️', nameVi: 'Bồ Câu Tình Yêu', category: 'wedding' },
  { code: '🥂', nameVi: 'Cụng Ly', category: 'wedding' },
  { code: '💌', nameVi: 'Thư Tình', category: 'wedding' },
  { code: '🌹', nameVi: 'Hoa Hồng Đỏ', category: 'wedding' },
  { code: '🎀', nameVi: 'Nơ Duyên Dáng', category: 'wedding' },
  { code: '❤️', nameVi: 'Trái Tim Đỏ', category: 'wedding' },
  { code: '🤍', nameVi: 'Trái Tim Trắng', category: 'wedding' },

  // Party & Birthday
  { code: '🎉', nameVi: 'Pháo Giấy', category: 'party' },
  { code: '🎂', nameVi: 'Bánh Sinh Nhật', category: 'party' },
  { code: '🎈', nameVi: 'Bong Bóng Bay', category: 'party' },
  { code: '🪩', nameVi: 'Quả Cầu Disco', category: 'party' },
  { code: '🍾', nameVi: 'Rượu Champagne', category: 'party' },
  { code: '🥳', nameVi: 'Mặt Tiệc Tùng', category: 'party' },
  { code: '🎆', nameVi: 'Pháo Hoa', category: 'party' },
  { code: '👑', nameVi: 'Vương Miện', category: 'party' },
  { code: '🎁', nameVi: 'Hộp Quà', category: 'party' },
  { code: '🕶️', nameVi: 'Kính Râm Cool', category: 'party' },
  { code: '🍸', nameVi: 'Cocktail', category: 'party' },
  { code: '🍻', nameVi: 'Bia Tươi Cụng Ly', category: 'party' },

  // Korean Photobooth & Cute Y2K
  { code: '🌸', nameVi: 'Hoa Anh Đào', category: 'korean' },
  { code: '✨', nameVi: 'Lấp Lánh Sparkles', category: 'korean' },
  { code: '⭐', nameVi: 'Ngôi Sao Vàng', category: 'korean' },
  { code: '📸', nameVi: 'Máy Ảnh Chụp Liền', category: 'korean' },
  { code: '✌️', nameVi: 'Tạo Dáng Chữ V', category: 'korean' },
  { code: '🫰', nameVi: 'Bắn Tim Ngón Tay', category: 'korean' },
  { code: '🐰', nameVi: 'Thỏ Cute', category: 'korean' },
  { code: '🐱', nameVi: 'Mèo Con', category: 'korean' },
  { code: '🧸', nameVi: 'Gấu Bông', category: 'korean' },
  { code: '⚡', nameVi: 'Tia Sét Y2K', category: 'korean' },
  { code: '✦', nameVi: 'Sao Bốn Cánh Retro', category: 'retro' },
  { code: '✿', nameVi: 'Hoa Cúc Họa Mi', category: 'retro' },
  { code: '🍀', nameVi: 'Cỏ Bốn Lá', category: 'retro' },
  { code: '🦄', nameVi: 'Kỳ Lân', category: 'retro' },
  { code: '🍓', nameVi: 'Dâu Tây Ngọt Ngào', category: 'retro' },
  { code: '🌈', nameVi: 'Cầu Vồng May Mắn', category: 'retro' },
];
