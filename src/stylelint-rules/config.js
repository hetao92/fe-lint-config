import { defaultDesignTokens } from '../design-tokens/default.ts';

/**
 * 默认配置值
 */
export const DEFAULT_CONFIG = {
  tokens: {},
  useDefaultOBUIToken: true,
  useCSSVariable: true,
  cssVariablePrefix: '',
  ignoreProperties: [],
  ignoreValues: [],
  disableFix: false,
  enableWarningForNonTokenValues: false,
};

/**
 * 合并 tokens 配置
 * @param {Object} tokens - 用户提供的 tokens
 * @param {boolean} useDefaultOBUIToken - 是否使用默认 OBUI tokens
 * @returns {Object} 合并后的 tokens
 */
export function mergeTokens(tokens = {}, useDefaultOBUIToken = true) {
  return useDefaultOBUIToken
    ? { ...defaultDesignTokens, ...tokens }
    : tokens;
}

/**
 * 规范化配置选项
 * @param {Object} secondaryOptions - 原始配置选项
 * @returns {Object} 规范化后的配置
 */
export function normalizeOptions(secondaryOptions = {}) {
  return {
    tokens: secondaryOptions.tokens || DEFAULT_CONFIG.tokens,
    useDefaultOBUIToken:
      secondaryOptions.useDefaultOBUIToken ?? DEFAULT_CONFIG.useDefaultOBUIToken,
    mergedTokens: mergeTokens(
      secondaryOptions.tokens,
      secondaryOptions.useDefaultOBUIToken ?? DEFAULT_CONFIG.useDefaultOBUIToken,
    ),
    useCSSVariable:
      secondaryOptions.useCSSVariable ?? DEFAULT_CONFIG.useCSSVariable,
    cssVariablePrefix:
      secondaryOptions.cssVariablePrefix ?? DEFAULT_CONFIG.cssVariablePrefix,
    ignoreProperties:
      secondaryOptions.ignoreProperties || DEFAULT_CONFIG.ignoreProperties,
    ignoreValues: (secondaryOptions.ignoreValues || DEFAULT_CONFIG.ignoreValues).map(
      (pattern) => new RegExp(pattern, 'i'),
    ),
    disableFix: secondaryOptions.disableFix ?? DEFAULT_CONFIG.disableFix,
    enableWarningForNonTokenValues:
      secondaryOptions.enableWarningForNonTokenValues ??
      DEFAULT_CONFIG.enableWarningForNonTokenValues,
  };
}

/**
 * 配置验证规则（用于 stylelint validateOptions）
 */
export const VALIDATION_RULES = {
  tokens: [(value) => typeof value === 'object' && value !== null],
  useCSSVariable: [true, false],
  cssVariablePrefix: [(value) => typeof value === 'string'],
  ignoreProperties: [(value) => Array.isArray(value)],
  ignoreValues: [(value) => Array.isArray(value)],
  disableFix: [true, false],
  useDefaultOBUIToken: [true, false],
  enableWarningForNonTokenValues: [true, false],
};
