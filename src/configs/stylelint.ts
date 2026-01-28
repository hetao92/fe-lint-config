import { defaultDesignTokens } from '../design-tokens';
import useDesignTokens from '../stylelint-rules/use-design-tokens';
import { StylelintOptions } from '../types/stylelint';

export function stylelint(options?: StylelintOptions) {
  const {
    overrides = {},
    extends: customExtends = [],
    ignores = [],
    designTokens = {},
  } = options || {};

  // 构建插件列表
  const plugins: any[] = ['stylelint-less'];

  // 构建规则
  const rules: Record<string, any> = {
    'selector-class-pattern': null,
    'keyframes-name-pattern': null,
    'no-descending-specificity': null,
    'color-function-alias-notation': null,
    'declaration-property-value-no-unknown': [
      true,
      {
        ignoreProperties: {
          '/^.*$/': ['/@.*/', '/\\$.*/'],
        },
      },
    ], //忽略 less 中使用 @ 和 $ 开头的属性
    'color-function-notation': 'legacy',
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global', 'export'],
      },
    ],
    'media-feature-range-notation': 'prefix', // 只允许使用 min- 和 max-
  };

  // 如果启用了设计 token 检查
  if (designTokens?.enabled) {
    plugins.push(useDesignTokens);
    rules['ob/use-design-tokens'] = [
      true,
      {
        // 根据 useDefaultOBUIToken 控制是否与默认 tokens 取并集
        tokens:
          designTokens.useDefaultOBUIToken !== false
            ? { ...defaultDesignTokens, ...(designTokens.tokens || {}) }
            : designTokens.tokens || {},
        useCSSVariable: designTokens.useCSSVariable ?? true,
        cssVariablePrefix: designTokens.cssVariablePrefix ?? '',
        ignoreProperties: designTokens.ignoreProperties ?? [],
        ignoreValues: designTokens.ignoreValues ?? [],
        disableFix: designTokens.disableFix ?? false,
        useDefaultOBUIToken: designTokens.useDefaultOBUIToken ?? true,
        enableWarningForNonTokenValues:
          designTokens.enableWarningForNonTokenValues ?? true,
      },
    ];
  }

  return {
    ignoreFiles: ignores,
    extends: [
      'stylelint-config-standard',
      'stylelint-config-recommended-less',
      ...customExtends,
    ],
    plugins,
    overrides: [
      {
        files: ['**/*.less'],
        customSyntax: 'postcss-less',
      },
    ],
    rules: {
      ...rules,
      ...overrides,
    },
  };
}
