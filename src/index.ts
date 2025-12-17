/**
 * 主入口 - 延迟加载 ESLint 相关模块
 * 当用户只使用 Stylelint 时，不会加载 ESLint 依赖
 */

// ============ Stylelint 配置（直接导出，无副作用）============
export { stylelint } from "./configs/stylelint";
export { OBStylelintCfg } from "./stylelintFactory";
export type { StylelintOptions } from "./types/stylelint";

// ============ Globs 常量（无外部依赖）============
export * from "./globs";

// ============ 类型导出（仅编译时，无运行时影响）============
export type {
  Awaitable,
  OptionsComponentExts,
  OptionsConfig,
  OptionsFiles,
  OptionsOverrides,
  OptionsTypescript,
  OptionsTypeScriptWithTypes,
  TypedFlatConfigItem,
} from "./types/eslint";

// ============ ESLint 配置（同步延迟加载）============

type EslintFactoryModule = typeof import("./eslintFactory");
type ConfigsModule = typeof import("./configs");

let _eslintFactory: EslintFactoryModule | undefined;
let _configs: ConfigsModule | undefined;

function getEslintFactory(): EslintFactoryModule {
  if (!_eslintFactory) {
    // 同步动态导入 (CommonJS require)
    _eslintFactory = require("./eslintFactory.cjs") as EslintFactoryModule;
  }
  return _eslintFactory;
}

function getConfigs(): ConfigsModule {
  if (!_configs) {
    _configs = require("./configs.cjs") as ConfigsModule;
  }
  return _configs;
}

// ESLint 主函数
export const OBEslintCfg: EslintFactoryModule["OBEslintCfg"] = function (...args) {
  return getEslintFactory().OBEslintCfg(...args);
} as EslintFactoryModule["OBEslintCfg"];

export const resolveSubOptions: EslintFactoryModule["resolveSubOptions"] = function (...args) {
  return getEslintFactory().resolveSubOptions(...args);
} as EslintFactoryModule["resolveSubOptions"];

export const getOverrides: EslintFactoryModule["getOverrides"] = function (...args) {
  return getEslintFactory().getOverrides(...args);
} as EslintFactoryModule["getOverrides"];

// Configs 函数
export const ignores: ConfigsModule["ignores"] = function (...args) {
  return getConfigs().ignores(...args);
} as ConfigsModule["ignores"];

export const imports: ConfigsModule["imports"] = function (...args) {
  return getConfigs().imports(...args);
} as ConfigsModule["imports"];

export const javascript: ConfigsModule["javascript"] = function (...args) {
  return getConfigs().javascript(...args);
} as ConfigsModule["javascript"];

export const react: ConfigsModule["react"] = function (...args) {
  return getConfigs().react(...args);
} as ConfigsModule["react"];

export const typescript: ConfigsModule["typescript"] = function (...args) {
  return getConfigs().typescript(...args);
} as ConfigsModule["typescript"];

export const _prettier: ConfigsModule["_prettier"] = function (...args) {
  return getConfigs()._prettier(...args);
} as ConfigsModule["_prettier"];
