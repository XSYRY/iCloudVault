import type { Photo, ExifData, Category } from '../types';

const LOCATIONS = [
  '北京 · 故宫',
  '上海 · 外滩',
  '杭州 · 西湖',
  '三亚 · 亚龙湾',
  '成都 · 宽窄巷子',
  '厦门 · 鼓浪屿',
  '丽江 · 古城',
  '西安 · 兵马俑',
  '重庆 · 洪崖洞',
  '苏州 · 拙政园',
  '青岛 · 栈桥',
  '大理 · 洱海',
  null,
  null,
  null,
];

const CATEGORIES: Category[] = ['person', 'landscape', 'document', 'pet', 'food', 'object', 'other'];

const COLORS = [
  '#6750A4', '#E91E63', '#4CAF50', '#2196F3', '#FF9800',
  '#9C27B0', '#009688', '#FF5722', '#607D8B', '#795548',
  '#3F51B5', '#00BCD4', '#8BC34A', '#FFC107', '#F44336',
  '#673AB7', '#03A9F4', '#CDDC39', '#FF6F00', '#5D4037',
  '#AD1457', '#00838F', '#558B2F', '#EF6C00', '#4E342E',
  '#283593', '#00897B', '#9E9D24', '#D84315', '#37474F',
];

const ASPECT_RATIOS: [number, number][] = [
  [3, 4],
  [2, 3],
  [1, 1],
  [4, 3],
  [3, 2],
  [16, 9],
  [4, 5],
  [5, 7],
  [3, 5],
  [5, 3],
  [7, 4],
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generatePseudoPHash(id: number, category: Category): string {
  let bits = '';
  const baseline = category.charCodeAt(0) + category.charCodeAt(category.length - 1);
  for (let i = 0; i < 63; i++) {
    const val = Math.sin(id * 12.9898 + i * baseline) * 43758.5453;
    bits += (val - Math.floor(val)) > 0.5 ? '1' : '0';
  }
  return bits;
}

export function generateMockPhoto(id: number, overrideDate?: string): Photo {
  const year = overrideDate ? parseInt(overrideDate.slice(0, 4)) : randomInt(2024, 2025);
  const month = overrideDate ? overrideDate.slice(5, 7) : String(randomInt(1, 12)).padStart(2, '0');
  const day = overrideDate ? overrideDate.slice(8, 10) : String(randomInt(1, 28)).padStart(2, '0');
  const hour = String(randomInt(6, 22)).padStart(2, '0');
  const min = String(randomInt(0, 59)).padStart(2, '0');
  const sec = String(randomInt(0, 59)).padStart(2, '0');
  const dateTaken = overrideDate ?? `${year}-${month}-${day}`;
  const timeTaken = `${hour}:${min}:${sec}`;

  const [rw, rh] = pick(ASPECT_RATIOS);
  const baseSize = pick([1200, 1600, 2000, 2400, 3000, 4032]);
  const width = Math.round((baseSize * rw) / rh);
  const height = Math.round((baseSize * rh) / rw);

  const location = pick(LOCATIONS);

  const exif: ExifData = {
    make: pick(['Apple', 'Samsung', 'Google', 'Sony', 'Canon', undefined]),
    model: pick(['iPhone 15 Pro', 'Galaxy S24', 'Pixel 8', 'A7 IV', undefined]),
    fNumber: pick([1.8, 2.8, 4, 5.6, undefined]),
    exposureTime: pick(['1/125', '1/250', '1/500', '1/1000', undefined]),
    iso: pick([100, 200, 400, 800, undefined]),
    focalLength: pick(['24mm', '35mm', '50mm', '85mm', undefined]),
    flash: pick([true, false]),
    width,
    height,
  };

  const category = pick(CATEGORIES);
  const tags = generateTags(category);

  const isVideo = Math.random() > 0.9;
  const isLive = !isVideo && Math.random() > 0.85;

  return {
    id: `photo-${id}`,
    uri: `https://picsum.photos/seed/mimo${id}/${width > height ? 400 : 300}/${width > height ? 300 : 400}`,
    thumbnailUri: `https://picsum.photos/seed/mimo${id}/200/${Math.round(200 * rh / rw)}`,
    filename: isVideo
      ? `VID_${dateTaken.replace(/-/g, '')}_${hour}${min}${sec}.mp4`
      : isLive
        ? `IMG_${dateTaken.replace(/-/g, '')}_${hour}${min}${sec}.HEIC`
        : `IMG_${dateTaken.replace(/-/g, '')}_${hour}${min}${sec}.jpg`,
    sizeBytes: isVideo ? randomInt(10_000_000, 200_000_000) : isLive ? randomInt(3_000_000, 12_000_000) : randomInt(1_500_000, 8_000_000),
    width,
    height,
    createdAt: new Date(dateTaken).getTime() + randomInt(0, 86400000),
    dateTaken,
    timeTaken,
    latitude: location ? randomInt(18, 40) + Math.random() : null,
    longitude: location ? randomInt(100, 120) + Math.random() : null,
    locationName: location,
    exif,
    color: pick(COLORS),
    isFavorite: Math.random() > 0.8,
    isHidden: false,
    isPinned: Math.random() > 0.95,
    isDeleted: false,
    aiTags: tags,
    aiCategory: category,
    faceCount: category === 'person' ? randomInt(1, 5) : null,
    phash: generatePseudoPHash(id, category),
    embedding: null,
    duplicateOfId: null,
    edits: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      rotation: 0,
      crop: null,
      filter: null,
    },
    versions: [],
    rating: pick([0, 0, 0, 1, 2, 3, 4, 5]),
    mediaType: isVideo ? 'video' : isLive ? 'live' : 'photo',
    duration: isVideo ? randomInt(5, 180) : isLive ? 3000 : null,
    livePhotoVideoUri: isLive ? `https://picsum.photos/seed/mimo${id}live/400/300` : undefined,
  };
}

function generateTags(category: Category): string[] {
  const tagMap: Record<Category, string[]> = {
    person: ['人像', '自拍', '合影', '户外', '阳光'],
    landscape: ['风景', '自然', '蓝天', '山水', '旅行'],
    document: ['文档', '扫描', '表格', '合同', '笔记'],
    pet: ['宠物', '猫', '狗', '可爱', '室内'],
    food: ['美食', '餐厅', '晚餐', '甜点', '饮品'],
    object: ['物品', '特写', '日常', '室内'],
    other: ['照片'],
  };
  const pool = tagMap[category] || tagMap.other;
  const count = randomInt(2, pool.length);
  return pool.slice(0, count);
}

export function generateMockPhotos(count = 80): Photo[] {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = `${twoDaysAgo.getFullYear()}-${String(twoDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(twoDaysAgo.getDate()).padStart(2, '0')}`;

  const result: Photo[] = [];
  let id = 0;

  for (let i = 0; i < 25; i++) {
    result.push(generateMockPhoto(id++, todayStr));
  }
  for (let i = 0; i < 20; i++) {
    result.push(generateMockPhoto(id++, yesterdayStr));
  }
  for (let i = 0; i < 15; i++) {
    result.push(generateMockPhoto(id++, twoDaysAgoStr));
  }
  for (let i = 0; i < count - 60; i++) {
    result.push(generateMockPhoto(id++));
  }

  // 注入三组极具真实感的重复/相似照片，完美支撑去重功能！
  if (result.length > 20) {
    // 组 1：完美的 food 分类重复照片（完全相同的 pHash）
    const foodOriginal = result.find((p) => p.aiCategory === 'food');
    if (foodOriginal) {
      const foodDup: Photo = {
        ...foodOriginal,
        id: `photo-dup-1`,
        filename: foodOriginal.filename.replace('.jpg', '_copy.jpg'),
        createdAt: foodOriginal.createdAt + 2000, // 相差 2 秒
        isFavorite: false,
        isPinned: false,
      };
      result.push(foodDup);
    }

    // 组 2：高相似度但稍有变动的 pet 分类照片（pHash 相差 2 个 bit，相似度 ~96.8%）
    const petOriginal = result.find((p) => p.aiCategory === 'pet');
    if (petOriginal) {
      let dupPhash = petOriginal.phash || '';
      if (dupPhash.length === 63) {
        dupPhash =
          dupPhash.substring(0, 10) +
          (dupPhash[10] === '1' ? '0' : '1') +
          dupPhash.substring(11, 20) +
          (dupPhash[20] === '1' ? '0' : '1') +
          dupPhash.substring(21);
      }
      const petDup: Photo = {
        ...petOriginal,
        id: `photo-dup-2`,
        filename: petOriginal.filename.replace('.jpg', '_edit.jpg'),
        createdAt: petOriginal.createdAt + 5000, // 相差 5 秒
        phash: dupPhash,
        isFavorite: false,
        isPinned: false,
      };
      result.push(petDup);
    }

    // 组 3：完美的 person 人像重复照片（完全相同的 pHash）
    const personOriginal = result.find((p) => p.aiCategory === 'person');
    if (personOriginal) {
      const personDup: Photo = {
        ...personOriginal,
        id: `photo-dup-3`,
        filename: personOriginal.filename.replace('.jpg', '_backup.jpg'),
        createdAt: personOriginal.createdAt + 1000, // 相差 1 秒
        isFavorite: false,
        isPinned: false,
      };
      result.push(personDup);
    }
  }

  result.sort((a, b) => b.createdAt - a.createdAt);
  return result;
}
