import stylelint from 'stylelint';

import {
  normalizeOptions,
  VALIDATION_RULES,
} from './config.js';
import {
  buildCategorizedIndex,
  buildIndex,
  buildReplacement,
  CATEGORY_DEFINITIONS,
  createPropertyCategoryMap,
  getPropertyCategory,
  matchValue,
} from './token-engine.js';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'ob/use-design-tokens';
const messages = ruleMessages(ruleName, {
  rejected: (value, tokenName) =>
    `避免使用硬编码的值 "${value}"，请使用设计 token "${tokenName}"`,
  warning: (value) =>
    `当前值 "${value}" 可能不符合设计规范，请确认是否应该使用设计 token`,
});

const meta = {
  url: 'https://github.com/oceanbase/fe-lint-config',
  fixable: true,
};

// 使用新的属性到类别映射
const propertyCategoryMap = createPropertyCategoryMap();

/** 颜色/继承类关键字：整值为这些单词时不检查、不警告，直接跳过 */
const COLOR_AND_INHERITANCE_KEYWORDS = new Set([
  'transparent',
  'none',
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
  'currentcolor', // CSS 规范中大小写不敏感
]);

/** 字体相关关键字：整值为这些单词时不检查、不警告，直接跳过 */
const FONT_KEYWORDS = new Set([
  'normal',
  'bold',
  'italic',
  'oblique',
  'small-caps',
]);

/** 布局/对齐/显示等通用关键字：整值为这些单词时不检查、不警告，直接跳过 */
const LAYOUT_AND_DISPLAY_KEYWORDS = new Set([
  'auto',
  'center',
  'left',
  'right',
  'ellipsis',
  'underline',
  'line-through',
  'clip',
  'visible',
  'hidden',
  'scroll',
  'fixed',
  'static',
  'relative',
  'absolute',
  'sticky',
  'flex',
  'inline-flex',
  'block',
  'inline',
  'inline-block',
  'grid',
  'inline-grid',
  'none',
  'both',
  'top',
  'bottom',
  'middle',
  'baseline',
  'sub',
  'super',
  'text-top',
  'text-bottom',
]);

/**
 * 判断是否为应跳过的单词类值（整值或首尾空白修剪后为关键字）
 * @param {string} normalizedValue - 已标准化的 CSS 值（trim + toLowerCase），由调用方统一计算后传入
 * @param {string} property - CSS 属性名（用于判断是否为字体相关属性）
 */
function isSkippableKeywordValue(normalizedValue, property) {
  if (!normalizedValue || typeof normalizedValue !== 'string') return false;

  // 颜色/继承类关键字（所有属性通用）
  if (COLOR_AND_INHERITANCE_KEYWORDS.has(normalizedValue)) {
    return true;
  }

  // 字体相关关键字（仅对字体属性生效）
  if (property && /font|text/i.test(property)) {
    if (FONT_KEYWORDS.has(normalizedValue)) {
      return true;
    }
  }

  // 布局/对齐/显示等通用关键字（所有属性）
  if (LAYOUT_AND_DISPLAY_KEYWORDS.has(normalizedValue)) {
    return true;
  }

  return false;
}

/**
 * 判断是否为数字 0（含单位）：0 不需要匹配 token，直接跳过
 * @param {string} normalizedValue - 已标准化的 CSS 值
 * @returns {boolean} 是否为零值
 */
function isZeroValue(normalizedValue) {
  if (!normalizedValue || typeof normalizedValue !== 'string') return false;
  // 精确匹配 "0" 或 "0px"、"0em"、"0rem"、"0%" 等零值
  return /^0(?:px|em|rem|%|s|ms|deg|grad|rad|turn|vw|vh|vmin|vmax)?$/i.test(
    normalizedValue.trim(),
  );
}

/**
 * 判断是否为应跳过的相对单位值（百分比、em、rem、calc）
 * 这些单位是相对值，不适合用固定的 token 替换，且有特定的语义用途
 * @param {string} value - CSS 值（已标准化为小写）
 * @returns {boolean} 是否应该跳过
 */
function isRelativeUnitValue(value) {
  if (!value || typeof value !== 'string') return false;
  // 合并正则表达式：百分比和 em/rem 可以合并为一个正则
  // 注意：% 后面不需要 \b（单词边界），因为 % 本身就是边界
  return (
    /^-?\d+(?:\.\d+)?%/.test(value) || // 百分比
    /^-?\d+(?:\.\d+)?(?:em|rem)\b/.test(value) || // em、rem 单位
    /calc\(/.test(value) // calc() 函数（通常包含相对单位）
  );
}

/**
 * 判断属性是否应该被检查（根据类别的 allowedProperties 或 excludedProperties 配置）
 * @param {string} propertyName - CSS 属性名
 * @param {Object|null} categoryDef - 类别定义（由调用方查找后传入，避免重复 find）
 * @returns {boolean} 是否应该检查该属性
 */
function shouldCheckProperty(propertyName, categoryDef) {
  if (!categoryDef) return true;

  // 如果定义了 allowedProperties，只检查列表中的属性
  if (categoryDef.allowedProperties) {
    return categoryDef.allowedProperties.includes(propertyName);
  }

  // 如果定义了 excludedProperties，排除列表中的属性
  if (categoryDef.excludedProperties) {
    return !categoryDef.excludedProperties.includes(propertyName);
  }

  // 默认检查所有匹配 propertyPattern 的属性
  return true;
}

const ruleFunction = (primary, secondaryOptions, context) => {
  let tokenIndex;
  let categorizedIndex;
  let cachedTokens = null;
  let cachedUseDefaultOBUIToken = null;

  return (root, result) => {
    const validOptions = validateOptions(
      result,
      ruleName,
      {
        actual: primary,
        possible: [true, false],
      },
      {
        actual: secondaryOptions,
        possible: VALIDATION_RULES,
        optional: true,
      },
    );

    if (!validOptions || !primary) {
      return;
    }

    // 规范化配置选项
    const config = normalizeOptions(secondaryOptions);
    const {
      tokens,
      useDefaultOBUIToken,
      mergedTokens,
      useCSSVariable,
      cssVariablePrefix,
      ignoreProperties,
      ignoreValues,
      disableFix,
      enableWarningForNonTokenValues,
    } = config;

    // 构建索引 - 仅在首次构建或 tokens/useDefaultOBUIToken 配置改变时重新构建
    // 在 stylelint 中，同一个规则实例的配置通常是固定的，所以通过引用比较即可
    // 如果配置真的改变了（引用不同），则重新构建索引
    if (
      !tokenIndex ||
      cachedTokens !== tokens ||
      cachedUseDefaultOBUIToken !== useDefaultOBUIToken
    ) {
      tokenIndex = buildIndex(mergedTokens);
      categorizedIndex = buildCategorizedIndex(mergedTokens);
      cachedTokens = tokens;
      cachedUseDefaultOBUIToken = useDefaultOBUIToken;
    }

    if (tokenIndex.size === 0) {
      return;
    }

    root.walkDecls((decl) => {
      // 1. 检查属性是否忽略
      if (ignoreProperties.some((prop) => decl.prop.includes(prop))) {
        return;
      }

      const originalValue = decl.value;
      const normalizedValue = originalValue.trim().toLowerCase();

      // 2. 关键字整值直接跳过，不检查、不警告（颜色/继承类通用，字体类仅对字体属性生效）
      if (isSkippableKeywordValue(normalizedValue, decl.prop)) {
        return;
      }

      // 2.3. 数字 0（含 0px、0em 等）不需要匹配 token，直接跳过
      if (isZeroValue(normalizedValue)) {
        return;
      }

      // 2.5. 百分比和相对单位（%, em, rem, calc）直接跳过，不检查、不警告
      // 这些单位是相对值，不适合用固定的 token 替换，且有特定的语义用途
      if (isRelativeUnitValue(normalizedValue)) {
        return;
      }

      // 获取当前属性所属的类别，并只查一次 categoryDef 供后续逻辑复用
      const propertyCategory = getPropertyCategory(
        decl.prop,
        propertyCategoryMap,
      );
      const categoryDef = propertyCategory
        ? CATEGORY_DEFINITIONS.find((d) => d.name === propertyCategory)
        : null;

      // 检查属性是否应该被检查（根据类别的 allowedProperties 或 excludedProperties 配置）
      if (!shouldCheckProperty(decl.prop, categoryDef)) {
        return; // 跳过不应该检查的属性
      }

      // 3. 针对 token 匹配逻辑
      // 使用分类索引和属性名称，让 matchValue 函数进行类别匹配
      const refinedMatch = matchValue(
        originalValue,
        categorizedIndex,
        decl.prop,
        {
          enableNumberMatching: decl.prop.includes('font'),
        },
      );

      if (refinedMatch.type === 'whole' && refinedMatch.matches.length > 0) {
        const tokenName = refinedMatch.matches[0].name;
        if (
          !disableFix &&
          !ignoreValues.some((regex) => regex.test(originalValue))
        ) {
          const replacement = buildReplacement(
            tokenName,
            useCSSVariable,
            cssVariablePrefix,
          );
          report({
            message: messages.rejected(originalValue, replacement),
            node: decl,
            word: originalValue,
            result,
            ruleName,
            fix: () => {
              decl.value = replacement;
            },
          });
          return;
        }
      } else if (
        refinedMatch.type === 'segments' &&
        refinedMatch.segments &&
        refinedMatch.segments.length > 0
      ) {
        // 处理多值情况
        let newValue = originalValue;
        let hasChange = false;

        // 从后往前替换，避免索引问题
        for (let i = refinedMatch.segments.length - 1; i >= 0; i--) {
          const segmentInfo = refinedMatch.segments[i];

          if (
            segmentInfo.matches &&
            segmentInfo.matches.length > 0 &&
            segmentInfo.replacement
          ) {
            // 找到当前值在原始字符串中的位置并替换
            newValue = newValue.replace(
              segmentInfo.original,
              segmentInfo.replacement,
            );
            hasChange = true;
          }
        }

        if (hasChange && !disableFix) {
          report({
            message: messages.rejected(originalValue, newValue),
            node: decl,
            word: originalValue,
            result,
            ruleName,
            fix: () => {
              decl.value = newValue;
            },
          });
          return;
        }
      } else if ((refinedMatch.matches || []).length > 0) {
        const parts = refinedMatch.matches;
        let newValue = originalValue;
        let hasChange = false;

        for (let i = parts.length - 1; i >= 0; i--) {
          const {
            index,
            length,
            candidates: tokenCandidates,
            segment,
          } = parts[i];

          if (ignoreValues.some((regex) => regex.test(segment))) continue;
          const tokenName = tokenCandidates[0]?.name;
          if (!tokenName) continue;

          const replacement = buildReplacement(
            tokenName,
            useCSSVariable,
            cssVariablePrefix,
          );
          if (!disableFix) {
            const before = newValue.slice(0, index);
            const after = newValue.slice(index + length);
            newValue = before + replacement + after;
            hasChange = true;
          } else {
            const tokenNameMatch = replacement.match(/var\(([^)]+)\)|@([^,]+)/);
            const tokenName = tokenNameMatch
              ? tokenNameMatch[1] || tokenNameMatch[2]
              : 'tokens';
            report({
              message: messages.rejected(segment, tokenName),
              node: decl,
              index,
              word: segment,
              result,
              ruleName,
            });
          }
        }

        if (hasChange && !disableFix) {
          const tokenNameMatch = newValue.match(/var\(([^)]+)\)|@([^,]+)/);
          const tokenName = tokenNameMatch
            ? tokenNameMatch[1] || tokenNameMatch[2]
            : 'tokens';
          report({
            message: messages.rejected(originalValue, tokenName),
            node: decl,
            result,
            ruleName,
            fix: () => {
              decl.value = newValue;
            },
          });
          return;
        }
      }

      // 3. 非 token 值警告 - 直接使用 matchValue 已计算的 hasRelatedTokens；用已缓存的 categoryDef 判断是否相关类别
      if (enableWarningForNonTokenValues && categoryDef && refinedMatch.hasRelatedTokens) {
        const isUsingToken =
          originalValue.includes('var(') || originalValue.includes('@');

        if (!isUsingToken) {
          report({
            message: messages.warning(originalValue),
            node: decl,
            word: originalValue,
            result,
            ruleName,
            severity: 'warning', // 此类提示为建议级别，不作为 error
          });
        }
      }
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;
export default createPlugin(ruleName, ruleFunction);
