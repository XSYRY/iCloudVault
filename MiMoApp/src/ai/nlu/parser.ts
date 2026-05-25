import type { Category } from '../../types';

export interface ParsedIntent {
  time?: string;
  location?: string;
  keyword?: string;
  category?: Category;
  season?: string;
  raw: string;
}

interface PatternRule {
  regex: RegExp;
  field: keyof ParsedIntent;
  extract: (m: RegExpMatchArray) => string;
}

const TIME_PATTERNS: PatternRule[] = [
  { regex: /(\d{4})年/, field: 'time', extract: (m) => m[1] },
  { regex: /去年/, field: 'time', extract: () => String(new Date().getFullYear() - 1) },
  { regex: /前年/, field: 'time', extract: () => String(new Date().getFullYear() - 2) },
  { regex: /今年/, field: 'time', extract: () => String(new Date().getFullYear()) },
  { regex: /(\d{1,2})月/, field: 'time', extract: (m) => m[0] },
  { regex: /昨天/, field: 'time', extract: () => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }},
  { regex: /今天/, field: 'time', extract: () => new Date().toISOString().slice(0, 10) },
  { regex: /上周/, field: 'time', extract: () => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 7);
  }},
  { regex: /上个月/, field: 'time', extract: () => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  }},
];

const SEASON_MAP: Record<string, string> = {
  '春天': '03', '春季': '03', '春': '03',
  '夏天': '06', '夏季': '06', '夏': '06',
  '秋天': '09', '秋季': '09', '秋': '09',
  '冬天': '12', '冬季': '12', '冬': '12',
};

const SEASON_PATTERNS: PatternRule[] = Object.keys(SEASON_MAP).map((key) => ({
  regex: new RegExp(key),
  field: 'season',
  extract: () => key,
}));

const LOCATION_PATTERNS: PatternRule[] = [
  { regex: /在(.{1,6})拍/, field: 'location', extract: (m) => m[1] },
  { regex: /在(.{1,6})的/, field: 'location', extract: (m) => m[1] },
  { regex: /(海边|山上|公园|家里|公司|学校|餐厅|旅行|旅途|户外|室内|街头|海边|湖边|江边|河畔)/, field: 'location', extract: (m) => m[1] },
];

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  person: ['人', '人物', '人像', '自拍', '合影', '朋友', '家人', '宝宝', '孩子', '同事', '合照', '全家福'],
  landscape: ['风景', '山水', '自然', '蓝天', '大海', '草原', '沙漠', '森林', '湖泊', '瀑布', '日出', '日落', '夕阳', '星空', '银河'],
  document: ['文档', '扫描', '表格', '合同', '笔记', '截图', '证书', '发票', '收据', '文件'],
  pet: ['宠物', '猫', '狗', '兔子', '仓鼠', '鸟', '鱼', '龟', '小猫', '小狗', '猫咪', '狗狗'],
  food: ['食物', '美食', '餐厅', '晚餐', '午餐', '早餐', '甜点', '饮品', '咖啡', '蛋糕', '水果', '火锅', '烧烤'],
  object: ['物品', '特写', '日常', '建筑', '车', '花', '树', '手办', '收藏'],
  other: ['照片', '图片', '相片'],
};

const KEYWORD_PATTERNS: PatternRule[] = [
  { regex: /(日落|日出|夕阳|朝霞|晚霞|彩虹|极光)/, field: 'keyword', extract: (m) => m[1] },
  { regex: /(花|樱花|玫瑰|向日葵|薰衣草|荷花|梅花|菊花|郁金香)/, field: 'keyword', extract: (m) => m[1] },
  { regex: /(猫|狗|鸟|鱼|兔|蝴蝶|蜻蜓)/, field: 'keyword', extract: (m) => m[1] },
  { regex: /(雪|雨|雾|云|风|冰|霜)/, field: 'keyword', extract: (m) => m[1] },
  { regex: /(夜景|灯光|灯笼|烟花|篝火)/, field: 'keyword', extract: (m) => m[1] },
  { regex: /(生日|婚礼|毕业|节日|圣诞|新年|中秋|春节|国庆|情人节)/, field: 'keyword', extract: (m) => m[1] },
];

export function parseIntent(query: string): ParsedIntent {
  const intent: ParsedIntent = { raw: query };

  const allPatterns = [
    ...TIME_PATTERNS,
    ...SEASON_PATTERNS,
    ...LOCATION_PATTERNS,
    ...KEYWORD_PATTERNS,
  ];

  for (const { regex, field, extract } of allPatterns) {
    const match = query.match(regex);
    if (match && !intent[field]) {
      (intent as unknown as Record<string, unknown>)[field] = extract(match);
    }
  }

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (intent.category) break;
    for (const kw of keywords) {
      if (query.includes(kw)) {
        intent.category = cat as Category;
        break;
      }
    }
  }

  return intent;
}

export function getIntentSuggestions(query: string): string[] {
  const intent = parseIntent(query);
  const suggestions: string[] = [];

  if (intent.category && CATEGORY_KEYWORDS[intent.category]) {
    const related = CATEGORY_KEYWORDS[intent.category]
      .filter((kw) => !query.includes(kw))
      .slice(0, 3);
    suggestions.push(...related.map((kw) => `${query} ${kw}`));
  }

  if (intent.season && !intent.location) {
    suggestions.push(`${intent.season}的风景`, `${intent.season}的照片`);
  }

  return suggestions.slice(0, 5);
}

export { CATEGORY_KEYWORDS, SEASON_MAP };
