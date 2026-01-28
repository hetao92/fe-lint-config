// 值匹配引擎：负责"值 → 归一化 → Token 索引 → 安全替换"
// 支持：可配置的能力映射、索引构建缓存、按类型分区索引

// ========== 统一类别定义 ==========
/**
 * 统一的类别定义，包含类别名称、token 匹配模式和属性匹配模式
 */
const CATEGORY_DEFINITIONS = [
  {
    name: 'radius',
    tokenPattern: /radius/i, // 模糊匹配所有包含 "radius" 的令牌
    propertyPattern: /radius/i, // 模糊匹配所有包含 "radius" 的属性
  },
  {
    name: 'shadow',
    tokenPattern: /shadow/i, // 模糊匹配所有包含 "shadow" 的令牌
    propertyPattern: /shadow/i, // 模糊匹配所有包含 "shadow" 的属性
  },
  {
    name: 'border',
    tokenPattern: /border/i, // 模糊匹配所有包含 "border" 的令牌
    propertyPattern: /^border(-(color|top|right|bottom|left|inline|block))?$/i, // 匹配 border、border-color 及方向属性
    allowedProperties: [
      'border',
      'border-color',
      'border-top',
      'border-right',
      'border-bottom',
      'border-left',
      'border-top-color',
      'border-right-color',
      'border-bottom-color',
      'border-left-color',
      'border-inline-color',
      'border-block-color',
    ], // 只检查这些属性（border-width、border-style 等应跳过）
  },
  {
    name: 'background',
    tokenPattern: /background|bg/i, // 模糊匹配所有包含 "background" 的令牌
    propertyPattern: /^background(-color)?$/i, // 只匹配 background 和 background-color（优化：不再匹配其他子属性）
    allowedProperties: ['background', 'background-color'], // 只检查这些属性（其他子属性如 background-image 等应跳过）
  },
  {
    name: 'color',
    tokenPattern: /color/i, // 模糊匹配所有包含 "color" 的令牌
    // 只匹配真正的颜色相关属性，不匹配 text-align / text-decoration / text-overflow 等（它们没有颜色 token）
    propertyPattern: /color|fill|stroke|outline/i,
  },
  {
    name: 'spacing',
    tokenPattern: /space/i, // 模糊匹配所有包含 "space" 的令牌
    propertyPattern: /margin|padding|gap/i,
  },
  {
    name: 'font',
    tokenPattern: /font|letter-spacing|line-height|text/i, // 支持 font 模糊搜索以及 letter-spacing、line-height 精确搜索
    propertyPattern: /font|line-height|letter-spacing/i, // 模糊匹配所有相关的字体属性
  },
  {
    name: 'dimension',
    tokenPattern: /(^|[-_])(?<!-line-)(width|height)(?=[-_]|$)/i, // 匹配 width 或 height（但排除 line-width/height）
    propertyPattern: /width|height|min-width|max-width|min-height|max-height/i,
  },
];

// ========== 归一化与类型检测 ==========
function normalizeString(str) {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().replace(/\s+/g, ' ');
}

function expandShortHex(hex) {
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (hex.length === 5) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}${hex[4]}${hex[4]}`;
  }
  return hex;
}

function rgbToHex(rgb) {
  try {
    if (!rgb || typeof rgb !== 'string') return null;
    const match = rgb.match(
      /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i,
    );
    if (!match) return null;
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    const aStr = match[4];
    if (r > 255 || g > 255 || b > 255 || isNaN(r) || isNaN(g) || isNaN(b))
      return null;
    const toHex = (n) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    let hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    if (aStr !== undefined) {
      const a = parseFloat(aStr);
      if (!isNaN(a) && a >= 0 && a < 1) {
        const alphaInt = Math.round(a * 255);
        hex += toHex(alphaInt);
      }
    }
    return hex;
  } catch (error) {
    // 转换失败时返回 null，降级处理
    return null;
  }
}

function detectValueType(value) {
  try {
    if (!value || typeof value !== 'string') {
      return { type: 'unknown', normalized: String(value || '') };
    }
    const v = normalizeString(value);
    if (/^#[0-9a-f]{3,8}\b/i.test(v))
      return { type: 'color', normalized: expandShortHex(v) };
    if (/^(?:rgba?|hsla?)\s*\([^)]+\)$/i.test(v)) {
      const hex = rgbToHex(v);
      return { type: 'color', normalized: hex || v };
    }
    if (
      /^-?\d+(?:\.\d+)?(?:px|em|rem|%|vw|vh|vmin|vmax|deg|rad|grad|turn|s|ms)\b/i.test(
        v,
      )
    ) {
      return { type: 'length', normalized: v };
    }
    if (/^-?\d+(?:\.\d+)?$/.test(v)) {
      return { type: 'number', normalized: v };
    }
    // 简单识别阴影：包含至少一个长度与颜色函数/十六进制
    if (
      /(?:\d+px|\d+em|\d+rem)/i.test(v) &&
      (/(?:rgba?|hsla?)\s*\([^)]+\)/i.test(v) || /#[0-9a-f]{3,8}\b/i.test(v))
    ) {
      return { type: 'shadow', normalized: v };
    }
    return { type: 'unknown', normalized: v };
  } catch (error) {
    // 类型检测失败时返回 unknown，降级处理
    return { type: 'unknown', normalized: String(value || '') };
  }
}

// ========== 检查 token 是否属于指定类别 ==========
/**
 * 检查 token 是否属于指定类别
 * @param {string} tokenName - token 名称
 * @param {string} category - 类别名称
 * @returns {boolean} - 如果 token 属于指定类别则返回 true，否则返回 false
 */
export function isInCategory(tokenName, category) {
  const normalizedTokenName = normalizeString(tokenName);

  // 查找匹配的类别定义
  for (const categoryDef of CATEGORY_DEFINITIONS) {
    if (categoryDef.name === category) {
      return categoryDef.tokenPattern.test(normalizedTokenName);
    }
  }

  return false;
}

// ========== 获取 token 的主要类别 ==========
/**
 * 获取 token 的主要类别
 * @param {string} tokenName - token 名称
 * @returns {string} - 返回 token 的主要类别
 */
function getPrimaryCategory(tokenName) {
  const normalizedTokenName = normalizeString(tokenName);

  // 按照统一类别定义进行匹配
  for (const categoryDef of CATEGORY_DEFINITIONS) {
    if (categoryDef.tokenPattern.test(normalizedTokenName)) {
      return categoryDef.name;
    }
  }

  // 后备分类
  return 'unknown';
}

// ========== 按类别组织 tokens ==========
/**
 * 按类别组织 tokens
 * @param {Record<string, string>} tokens
 */
export function categorizeTokens(tokens) {
  // 初始化所有类别
  const categories = {};
  for (const categoryDef of CATEGORY_DEFINITIONS) {
    categories[categoryDef.name] = {};
  }

  for (const [name, value] of Object.entries(tokens || {})) {
    if (typeof value !== 'string') continue;

    // 按照定义的顺序尝试匹配每个类别
    let matched = false;
    for (const categoryDef of CATEGORY_DEFINITIONS) {
      if (name.match(categoryDef.tokenPattern)) {
        categories[categoryDef.name][name] = value;
        matched = true;
        // 不再中断，允许令牌属于多个类别
      }
    }

    // 如果没有匹配任何预定义类别，根据值类型进行后备分类
    if (!matched) {
      const normalizedValue = normalizeString(value);
      if (
        /^#[0-9a-f]{3,8}\b/i.test(normalizedValue) ||
        /^(rgba?|hsla?)\s*\([^)]+\)$/i.test(normalizedValue)
      ) {
        categories.color[name] = value;
      } else if (
        /-?\d+(?:\.\d+)?(?:px|em|rem|%|vw|vh|vmin|vmax|deg|rad|grad|turn|s|ms)\b/i.test(
          normalizedValue,
        )
      ) {
        categories.spacing[name] = value; // 默认归类到 spacing
      }
    }
  }

  return categories;
}

// ========== 索引构建 ==========
/**
 * 构建索引：带缓存与类型分区
 * @param {Record<string,string>} tokens
 * @param {{ capabilityMap?: Array<{match:RegExp|string|Function, cap:{type:string, sub:string}}>} } [options]
 * @returns {{ all: Map<string, any[]>, byType: Record<string, Map<string, any[]>>, caches: {detect: Map<string,{type:string,normalized:string}>}, size: number }}
 */
export function buildIndex(tokens, options = {}) {
  try {
    if (!tokens || typeof tokens !== 'object') {
      return { all: new Map(), byType: {}, caches: { detect: new Map() }, size: 0 };
    }
    const all = new Map();
    const byType = {
      color: new Map(),
      length: new Map(),
      shadow: new Map(),
      number: new Map(),
      unknown: new Map(),
    };
    const caches = { detect: new Map() };
    const add = (targetMap, key, item) => {
      if (!targetMap.has(key)) targetMap.set(key, []);
      targetMap.get(key).push(item);
    };
    const addAll = (key, item) => add(all, key, item);
    const addByType = (type, key, item) =>
      add(byType[type] || byType.unknown, key, item);

    for (const [name, rawValue] of Object.entries(tokens)) {
      try {
        if (!name || typeof rawValue !== 'string') continue;
        const cached = caches.detect.get(rawValue);
        let dt;
        if (cached) {
          dt = cached;
        } else {
          dt = detectValueType(rawValue);
          caches.detect.set(rawValue, dt);
        }
        // 使用新的分类方法替代旧的 capability 推断
        const category = getPrimaryCategory(name);
        const cap = { type: dt.type, sub: category };
        const vNorm = dt.normalized;
        const item = { name, value: normalizeString(rawValue), cap, type: dt.type };
        addAll(vNorm, item);
        addByType(dt.type, vNorm, item);
        // 颜色补充索引（短十六进制展开 / RGB 转十六进制）
        if (dt.type === 'color' && /^#[0-9a-f]{3,8}\b/i.test(vNorm)) {
          const shortHex = expandShortHex(vNorm);
          addAll(shortHex, item);
          addByType('color', shortHex, item);
        }
        if (dt.type === 'color' && /^(?:rgba?|hsla?)\s*\([^)]+\)$/i.test(vNorm)) {
          const hex = rgbToHex(vNorm);
          if (hex) {
            addAll(hex, item);
            addByType('color', hex, item);
          }
        }
      } catch (error) {
        // 单个 token 处理失败时跳过，继续处理其他 token
        continue;
      }
    }
    return { all, byType, caches, size: all.size };
  } catch (error) {
    // 索引构建失败时返回空索引，降级处理
    return { all: new Map(), byType: {}, caches: { detect: new Map() }, size: 0 };
  }
}

// ========== 按类别构建索引 ==========
/**
 * 按类别构建索引
 * @param {Record<string, string>} tokens
 * @param {object} options
 */
export function buildCategorizedIndex(tokens, options = {}) {
  try {
    if (!tokens || typeof tokens !== 'object') {
      return { categorized: {}, indexes: {} };
    }
    const categorized = categorizeTokens(tokens);
    const indexes = {};

    for (const [category, categoryTokens] of Object.entries(categorized)) {
      try {
        if (Object.keys(categoryTokens).length > 0) {
          indexes[category] = buildIndex(categoryTokens, options);
        }
      } catch (error) {
        // 单个类别索引构建失败时跳过，继续处理其他类别
        continue;
      }
    }

    return { categorized, indexes };
  } catch (error) {
    // 分类索引构建失败时返回空索引，降级处理
    return { categorized: {}, indexes: {} };
  }
}

// ========== 创建属性到类别的映射 ==========
/**
 * 创建属性到类别的映射（使用正则表达式进行模糊匹配）
 */
export function createPropertyCategoryMap() {
  const map = {};
  for (const category of CATEGORY_DEFINITIONS) {
    map[category.name] = category.propertyPattern;
  }
  return map;
}

// ========== 检查属性是否属于某个类别（模糊匹配） ==========
/**
 * 检查属性是否属于某个类别（模糊匹配）
 * @param {string} propName - CSS 属性名称
 * @param {object} propertyCategoryMap - 属性到类别的映射
 * @returns {string|null} - 如果找到匹配的类别则返回类别名称，否则返回 null
 */
export function getPropertyCategory(
  propName,
  propertyCategoryMap = createPropertyCategoryMap(),
) {
  // 按原始顺序返回第一个匹配的类别
  for (const [category, regex] of Object.entries(propertyCategoryMap)) {
    if (regex.test(propName)) {
      return category;
    }
  }

  return null; // 不属于任何类别
}

// ========== 分割CSS值的辅助函数 ==========
function splitCSSValues(value) {
  try {
    if (!value || typeof value !== 'string') {
      return [String(value || '')];
    }
    // 简单的CSS值分割，处理常见的多值情况
    // 处理逗号分隔的值（如 box-shadow 多重阴影）
    if (value.includes(',')) {
      const parts = [];
      let current = '';
      let parenCount = 0;

      for (let i = 0; i < value.length; i++) {
        const char = value[i];

        if (char === '(') {
          parenCount++;
        } else if (char === ')') {
          parenCount--;
        }

        if (char === ',' && parenCount === 0) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }

      if (current) parts.push(current.trim());

      // 对每个部分进一步按空格分割
      const result = [];
      for (const part of parts) {
        if (part.includes('(') && part.includes(')')) {
          // 这是一个函数调用（如 rgba、hsl 等），不要进一步分割
          result.push(part);
        } else {
          // 按空格分割非函数部分
          const subParts = part
            .trim()
            .split(/\s+/)
            .filter((p) => p.length > 0);
          result.push(...subParts);
        }
      }

      return result.length > 0 ? result : [value];
    }

    // 对于非逗号分隔的值，按空格分割，但保留函数调用
    const tokens = [];
    let current = '';
  let parenCount = 0;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];

    if (char === '(') {
      parenCount++;
    } else if (char === ')') {
      parenCount--;
    }

    if (char === ' ' && parenCount === 0) {
      if (current.trim()) {
        tokens.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

    if (current.trim()) {
      tokens.push(current.trim());
    }

    return tokens.length > 0 ? tokens : [value];
  } catch (error) {
    // 分割失败时返回原值，降级处理
    return [String(value || '')];
  }
}

// ========== 颜色值匹配（公共函数） ==========
/**
 * 在颜色类别中匹配颜色值（用于 border、background 和 -color 属性）
 * @param {string} singleValue - 原始值
 * @param {Object} valueType - 值类型检测结果（包含 type 和 normalized）
 * @param {Object} categorizedIndex - 已分类的索引对象
 * @returns {Object} 匹配结果 { original, matches, replacement }
 */
function matchColorValue(singleValue, valueType, categorizedIndex) {
  // 只有颜色类型的值才继续处理，其他类型直接跳过
  if (valueType.type !== 'color') {
    return {
      original: singleValue.trim(),
      matches: [],
      replacement: null,
    };
  }


  const colorIndex = categorizedIndex.indexes['color'];
  if (colorIndex) {
    const colorTypeIndex = colorIndex.byType['color'] || new Map();
    const colorCandidates = colorTypeIndex.get(valueType.normalized) || [];
    if (colorCandidates.length > 0) {
      return {
        original: singleValue.trim(),
        matches: colorCandidates,
        replacement: buildReplacement(colorCandidates[0].name, true, null),
      };
    }
  }

  // 没有找到颜色匹配项
  return {
    original: singleValue.trim(),
    matches: [],
    replacement: null,
  };
}

// ========== 单值匹配逻辑 ==========
function matchSingleValue(
  singleValue,
  categoryIndex,
  categorizedIndex,
  propertyCategory,
  propName,
) {
  const normalizedSingleValue = normalizeString(singleValue.trim());
  const valueType = detectValueType(normalizedSingleValue);

  // 对于复合属性（实际的 border 或 background 属性），只校验颜色值，其他值跳过
  if (propName === 'border' || propName === 'background') {
    return matchColorValue(singleValue, valueType, categorizedIndex);
  }

  // 对于 color 相关的属性（如 background-color, border-color 等），也只处理颜色值
  if (propName.includes('-color')) {
    return matchColorValue(singleValue, valueType, categorizedIndex);
  }

  const typeIndex = categoryIndex.byType[valueType.type] || new Map();
  const candidates = typeIndex.get(valueType.normalized) || [];

  // 如果在原始类别中找到了匹配项，直接返回
  if (candidates.length > 0) {
    return {
      original: singleValue.trim(),
      matches: candidates,
      replacement: buildReplacement(candidates[0].name, true, null),
    };
  }

  // 没有找到匹配项
  return {
    original: singleValue.trim(),
    matches: [],
    replacement: null,
  };
}

// ========== 值匹配辅助函数 ==========

/**
 * 检查属性是否应该跳过匹配
 * @param {string} propName - CSS 属性名
 * @returns {boolean} 是否应该跳过
 */
function shouldSkipProperty(propName) {
  return propName.toLowerCase().includes('content');
}

/**
 * 验证并获取属性类别和索引
 * @param {string} propName - CSS 属性名
 * @param {object} categorizedIndex - 已分类的索引对象
 * @returns {{ propertyCategory: string, categoryIndex: object } | null} 类别和索引，如果无效则返回 null
 */
function validateCategory(propName, categorizedIndex) {
  const propertyCategory = getPropertyCategory(propName);
  if (!propertyCategory || !categorizedIndex.indexes[propertyCategory]) {
    return null;
  }
  return {
    propertyCategory,
    categoryIndex: categorizedIndex.indexes[propertyCategory],
  };
}

/**
 * 尝试整体匹配值
 * @param {string} value - 原始值
 * @param {object} categoryIndex - 类别索引
 * @returns {Object|null} 匹配结果，如果没有匹配则返回 null
 */
function matchWholeValue(value, categoryIndex) {
  const normalizedValue = normalizeString(value);
  const valueType = detectValueType(normalizedValue);
  const typeIndex = categoryIndex.byType[valueType.type] || new Map();
  const candidates = typeIndex.get(valueType.normalized) || [];

  if (candidates.length > 0) {
    return { type: 'whole', matches: candidates, segments: [], value };
  }
  return null;
}

/**
 * 处理单值匹配情况（无匹配时可能返回警告）
 * @param {string} value - 原始值
 * @param {string} propName - CSS 属性名
 * @param {string} propertyCategory - 属性类别
 * @param {object} categorizedIndex - 已分类的索引对象
 * @returns {Object} 匹配结果
 */
function matchSingleValueCase(value, propName, propertyCategory, categorizedIndex) {
  const hasRelatedTokens = checkHasRelatedTokens(
    categorizedIndex,
    propertyCategory,
    propName,
  );

  if (hasRelatedTokens) {
    return {
      type: 'whole',
      matches: [],
      segments: [],
      value,
      hasRelatedTokens: true,
      warning: `属性 ${propName} 的值 "${value}" 没有匹配到相应的设计令牌，但该类别中存在相关令牌，请检查是否应该使用设计令牌`,
    };
  }

  // 如果该类别中没有任何相关令牌，跳过检查
  return { type: 'whole', matches: [], segments: [], value };
}

// ========== 值匹配：根据样式属性类别匹配设计令牌 ==========
/**
 * 值匹配：根据样式属性类别匹配设计令牌
 * 整体设计逻辑：
 * 1. 根据 CSS 属性确定类别
 * 2. 在对应类别的令牌集合中查找匹配
 * 3. 如果找到匹配则返回，否则根据策略处理
 * @param {string} value - 要匹配的值
 * @param {object} categorizedIndex - 已分类的索引对象，包含 categorized 和 indexes
 * @param {string} propName - CSS 属性名
 * @param {{ enableNumberMatching?: boolean }} [options]
 */
export function matchValue(value, categorizedIndex, propName, options = {}) {
  try {
    if (!value || typeof value !== 'string' || !propName || typeof propName !== 'string') {
      return { type: 'whole', matches: [], segments: [], value: String(value || '') };
    }
    if (!categorizedIndex || typeof categorizedIndex !== 'object') {
      return { type: 'whole', matches: [], segments: [], value };
    }

    // 1. 早期退出：content 属性直接跳过
    if (shouldSkipProperty(propName)) {
      return { type: 'whole', matches: [], segments: [], value };
    }

    // 2. 验证并获取类别和索引
    const categoryInfo = validateCategory(propName, categorizedIndex);
    if (!categoryInfo) {
      return { type: 'whole', matches: [], segments: [], value };
    }
    const { propertyCategory, categoryIndex } = categoryInfo;

    // 3. 尝试整体匹配
    const wholeMatch = matchWholeValue(value, categoryIndex);
    if (wholeMatch) {
      return wholeMatch;
    }

    // 4. 整体匹配失败，尝试分割后再分别匹配
    const values = splitCSSValues(value);

    // 5. 根据分割后的值数量选择处理策略
    if (values.length <= 1) {
      // 单值情况：可能返回警告
      return matchSingleValueCase(value, propName, propertyCategory, categorizedIndex);
    } else {
      // 多值情况：分别处理每个值
      return handleMultiValue(
        values,
        categoryIndex,
        categorizedIndex,
        propertyCategory,
        propName,
        value,
      );
    }
  } catch (error) {
    // 匹配过程失败时返回空匹配，降级处理
    return { type: 'whole', matches: [], segments: [], value: String(value || '') };
  }
}

// ========== 检查类别中是否有相关令牌 ==========
// 与 use-design-tokens 警告分支保持一致：使用该类别的 tokenPattern 判断
function checkHasRelatedTokens(categorizedIndex, propertyCategory, _propName) {
  const categoryDef = CATEGORY_DEFINITIONS.find((d) => d.name === propertyCategory);
  if (!categoryDef) return false;
  const categoryTokens = categorizedIndex.categorized[propertyCategory] || {};
  for (const tokenName of Object.keys(categoryTokens)) {
    if (categoryDef.tokenPattern.test(tokenName)) {
      return true;
    }
  }
  return false;
}

// ========== 处理多值情况 ==========
function handleMultiValue(
  values,
  categoryIndex,
  categorizedIndex,
  propertyCategory,
  propName,
  originalValue,
) {
  const segments = [];
  let hasAnyMatch = false;

  for (const singleValue of values) {
    const segmentResult = matchSingleValue(
      singleValue,
      categoryIndex,
      categorizedIndex,
      propertyCategory,
      propName,
    );

    segments.push(segmentResult);

    if (segmentResult.matches && segmentResult.matches.length > 0) {
      hasAnyMatch = true;
    }
  }

  // 如果有任何匹配，返回段落匹配结果
  if (hasAnyMatch) {
    return {
      type: 'segments',
      matches: [],
      segments: segments,
      value: originalValue,
    };
  }

  // 检查类别中是否有相关令牌
  const hasRelatedTokensInCategory = checkHasRelatedTokens(
    categorizedIndex,
    propertyCategory,
    propName,
  );

  // 如果没有任何匹配但类别中有相关令牌，返回警告
  if (hasRelatedTokensInCategory) {
    return {
      type: 'whole',
      matches: [],
      segments: [],
      value: originalValue,
      hasRelatedTokens: true,
      warning: `属性 ${propName} 的值 "${originalValue}" 没有匹配到相应的设计令牌，但该类别中存在相关令牌，请检查是否应该使用设计令牌`,
    };
  }

  // 否则返回无匹配
  return {
    type: 'whole',
    matches: [],
    segments: segments,
    value: originalValue,
  };
}

// ========== 安全替换 ==========
export function buildReplacement(name, useCSSVariable, cssVariablePrefix) {
  if (useCSSVariable) {
    let varName;
    if (name.startsWith('--')) {
      if (cssVariablePrefix) {
        varName = `--${cssVariablePrefix}-${name.slice(2)}`;
      } else {
        varName = name;
      }
    } else {
      if (cssVariablePrefix) {
        varName = `--${cssVariablePrefix}-${name}`;
      } else {
        varName = `--${name}`;
      }
    }
    return `var(${varName})`;
  }
  return `@${name}`;
}

// 导出类别定义，供 use-design-tokens 规则使用
export { CATEGORY_DEFINITIONS };
