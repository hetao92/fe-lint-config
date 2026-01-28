/**
 * Stylelint 配置独立入口
 * 使用方式: import { OBStylelintCfg } from '@oceanbase/lint-config/stylelint'
 */
export * from './configs/stylelint';
export * from './stylelintFactory';
export * from './types/stylelint';

export { stylelintPlugins, useDesignTokens } from './stylelint-rules/index';
