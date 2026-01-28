import stylelint from 'stylelint';

type ConfigExtends = string[];
type ConfigRules = Record<string, stylelint.ConfigRuleSettings<any, object>>;

/**
 * 设计 Token 配置
 */
export interface DesignTokensOptions {
  /** 是否启用设计 token 检查，默认 false */
  enabled?: boolean;
  /** Token 映射配置 { tokenName: colorValue } */
  tokens?: Record<string, string>;
  /** 是否合并默认的 OceanBase UI tokens，默认 true */
  useDefaultOBUIToken?: boolean;
  /** 是否使用 CSS 变量格式 var(--token-name)，默认 true */
  useCSSVariable?: boolean;
  /** CSS 变量前缀，如 'ob' 会生成 var(--ob-tokenName) */
  cssVariablePrefix?: string;
  /** 忽略的 CSS 属性列表 */
  ignoreProperties?: string[];
  /** 忽略的值（正则表达式字符串数组） */
  ignoreValues?: string[];
  /** 是否禁用自动修复，默认 false */
  disableFix?: boolean;
  /** 是否对未使用设计 token 的值发出警告，默认 false */
  enableWarningForNonTokenValues?: boolean;
}

export interface StylelintOptions {
  plugins?: string[];
  extends?: ConfigExtends;
  overrides?: ConfigRules;
  ignores?: string[];
  /** 设计 Token 检查配置 */
  designTokens?: DesignTokensOptions;
}
