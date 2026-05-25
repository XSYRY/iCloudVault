// ============================================================
// 常量 — 应用全局配置
// ============================================================

export const APP_NAME = 'Momento';
export const APP_VERSION = '0.1.0';

// 存储 key
export const KEYS = {
  SETTINGS: 'mimo-settings',
  ONBOARDING: 'mimo-onboarding',
  PIN: 'mimo-pin',
  SEARCH_HISTORY: 'mimo-search-history',
} as const;

// 网格
export const GRID = {
  MIN_COLUMNS: 2,
  MAX_COLUMNS: 5,
  DEFAULT_COLUMNS: 3,
  DEFAULT_GAP: 2,
  DEFAULT_PADDING: 2,
} as const;

// AI
export const AI = {
  BATCH_SIZE: 5,
  IDLE_DELAY_MS: 3000, // 空闲多久后开始后台分析
} as const;

// 回收站
export const TRASH = {
  AUTO_DELETE_DAYS: 30,
} as const;

// 类别图标映射
export const CATEGORY_ICON: Record<string, string> = {
  person: 'user',
  landscape: 'mountain',
  document: 'file-text',
  pet: 'cat',
  food: 'utensils',
  object: 'box',
  other: 'camera',
};

export const CATEGORY_LABELS: Record<string, string> = {
  person: '人物',
  landscape: '风景',
  document: '文档',
  pet: '宠物',
  food: '食物',
  object: '物品',
  other: '其他',
};

export type ThemeName = 'dynamic' | 'mint' | 'sunset' | 'ocean' | 'forest';

export const THEME_NAMES: ThemeName[] = ['dynamic', 'mint', 'sunset', 'ocean', 'forest'];

export const THEME_LABELS: Record<ThemeName, string> = {
  dynamic: '动态取色',
  mint: '薄荷绿',
  sunset: '日落暖',
  ocean: '海洋蓝',
  forest: '森林',
};
