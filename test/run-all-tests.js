#!/usr/bin/env node

import { runSingleTest } from './test-framework.js';

/**
 * 自动运行所有测试用例的汇总脚本
 * 用法: node test/run-all-tests.js
 */

const categories = [
  'color',
  'spacing',
  'font',
  'radius',
  'shadow',
  'border',
  'background',
  'dimension',
];

console.log('开始运行所有测试用例...\n');

// 运行所有测试
const results = await Promise.all(
  categories.map((category) => runSingleTest(category)),
);

// 输出每个测试的结果
for (const result of results) {
  console.log(result.output);
}

// 汇总统计
console.log('\n' + '='.repeat(60));
console.log('测试汇总');
console.log('='.repeat(60));

let totalExpected = 0;
let totalMatches = 0;
let totalFailures = 0;
const categoryResults = [];

for (const result of results) {
  if (!result.success) {
    totalFailures++;
    categoryResults.push({
      category: result.category,
      success: false,
      rate: 0,
    });
    continue;
  }

  const comparison = result.comparison;
  const categoryExpected =
    comparison.replace.expected +
    comparison.skip.expected +
    comparison.warn.expected;
  const categoryMatches =
    comparison.replace.matches.length +
    comparison.skip.matches.length +
    comparison.warn.matches.length;

  totalExpected += categoryExpected;
  totalMatches += categoryMatches;

  const categoryFailures =
    comparison.replace.missing.length +
    comparison.replace.unexpected.length +
    comparison.skip.missing.length +
    comparison.skip.unexpected.length +
    comparison.warn.missing.length +
    comparison.warn.unexpected.length;

  if (categoryFailures > 0) {
    totalFailures++;
  }

  const rate = categoryExpected > 0 ? (categoryMatches / categoryExpected) * 100 : 100;

  categoryResults.push({
    category: result.category,
    success: categoryFailures === 0,
    rate,
    expected: categoryExpected,
    matches: categoryMatches,
    failures: categoryFailures,
  });
}

// 输出每个类别的结果
console.log('\n各类别测试结果:');
console.log('-'.repeat(60));
for (const categoryResult of categoryResults) {
  const status = categoryResult.success ? '✓' : '✗';
  const rate = categoryResult.rate.toFixed(2);
  console.log(
    `${status} ${categoryResult.category.padEnd(12)} ${rate.padStart(6)}% (${categoryResult.matches || 0}/${categoryResult.expected || 0})`,
  );
}

// 总体统计
const overallRate = totalExpected > 0 ? (totalMatches / totalExpected) * 100 : 100;
console.log('\n' + '-'.repeat(60));
console.log(`总体成功率: ${overallRate.toFixed(2)}% (${totalMatches}/${totalExpected})`);
console.log(`失败类别数: ${totalFailures}/${categories.length}`);

// 详细失败信息
if (totalFailures > 0) {
  console.log('\n失败详情:');
  console.log('-'.repeat(60));
  for (const result of results) {
    if (!result.success) {
      console.log(`\n${result.category}: ${result.error || '测试失败'}`);
      continue;
    }

    const comparison = result.comparison;
    const hasFailures =
      comparison.replace.missing.length > 0 ||
      comparison.replace.unexpected.length > 0 ||
      comparison.skip.missing.length > 0 ||
      comparison.skip.unexpected.length > 0 ||
      comparison.warn.missing.length > 0 ||
      comparison.warn.unexpected.length > 0;

    if (hasFailures) {
      console.log(`\n${result.category}:`);
      if (comparison.replace.missing.length > 0) {
        console.log(`  期望替换但未替换 (${comparison.replace.missing.length}):`);
        for (const item of comparison.replace.missing.slice(0, 5)) {
          console.log(
            `    - 行 ${item.line}: .${item.selector} { ${item.property}: ${item.value}; }`,
          );
        }
        if (comparison.replace.missing.length > 5) {
          console.log(`    ... 还有 ${comparison.replace.missing.length - 5} 个`);
        }
      }
      if (comparison.skip.missing.length > 0) {
        console.log(`  期望跳过但未跳过 (${comparison.skip.missing.length}):`);
        for (const item of comparison.skip.missing.slice(0, 5)) {
          console.log(
            `    - 行 ${item.line}: .${item.selector} { ${item.property}: ${item.value}; }`,
          );
        }
        if (comparison.skip.missing.length > 5) {
          console.log(`    ... 还有 ${comparison.skip.missing.length - 5} 个`);
        }
      }
      if (comparison.warn.missing.length > 0) {
        console.log(`  期望警告但未警告 (${comparison.warn.missing.length}):`);
        for (const item of comparison.warn.missing.slice(0, 5)) {
          console.log(
            `    - 行 ${item.line}: .${item.selector} { ${item.property}: ${item.value}; }`,
          );
        }
        if (comparison.warn.missing.length > 5) {
          console.log(`    ... 还有 ${comparison.warn.missing.length - 5} 个`);
        }
      }
    }
  }
}

console.log('\n' + '='.repeat(60));

// 根据结果退出
if (totalFailures > 0) {
  process.exit(1);
}
