/**
 * Stylelint 配置独立入口
 * 使用方式: import { OBStylelintCfg } from '@oceanbase/lint-config/stylelint'
 */
export * from './configs/stylelint';
export * from './stylelintFactory';
export * from './types/stylelint';

// 导出设计 token 插件，方便用户单独使用
export { defaultDesignTokens as exampleDesignTokens } from './design-tokens/default';
export { stylelintPlugins, useDesignTokens } from './stylelint-rules/index';
