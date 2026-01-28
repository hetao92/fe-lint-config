#!/usr/bin/env node

import { runSingleTest } from './test-framework.js';

/**
 * 单个测试用例运行器
 * 用法: node test/run-test.js <category>
 * 例如: node test/run-test.js color
 */
const category = process.argv[2];

if (!category) {
  console.error('错误: 请指定测试类别');
  console.error('用法: node test/run-test.js <category>');
  console.error('可用类别: color, spacing, font, radius, shadow, border, background, dimension');
  process.exit(1);
}

const validCategories = [
  'color',
  'spacing',
  'font',
  'radius',
  'shadow',
  'border',
  'background',
  'dimension',
];

if (!validCategories.includes(category)) {
  console.error(`错误: 无效的测试类别 "${category}"`);
  console.error('可用类别:', validCategories.join(', '));
  process.exit(1);
}

// 运行测试
runSingleTest(category)
  .then((result) => {
    console.log(result.output);
    if (!result.success) {
      process.exit(1);
    }

    // 检查是否有失败项
    const hasFailures =
      result.comparison.replace.missing.length > 0 ||
      result.comparison.replace.unexpected.length > 0 ||
      result.comparison.skip.missing.length > 0 ||
      result.comparison.skip.unexpected.length > 0 ||
      result.comparison.warn.missing.length > 0 ||
      result.comparison.warn.unexpected.length > 0;

    if (hasFailures) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('运行测试时出错:', error);
    process.exit(1);
  });
