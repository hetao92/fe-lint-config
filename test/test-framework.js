import stylelint from 'stylelint';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import useDesignTokens from '../src/stylelint-rules/use-design-tokens.js';
import { defaultDesignTokens } from '../src/design-tokens/default.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 解析测试用例文件，提取所有 CSS 声明
 * 期望类型由文件名决定：replace.css -> replace, skip.css -> skip, warn.css -> warn
 * @param {string} filePath - 测试用例文件路径
 * @param {string} expectedType - 期望类型：'replace' | 'skip' | 'warn'
 * @returns {Array} 该类型的期望声明数组
 */
export function parseTestFile(filePath, expectedType) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const declarations = [];
  let currentSelector = null;
  let lineNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    lineNumber = i + 1;

    // 检测选择器
    const selectorMatch = line.match(/^\.([\w-]+)/);
    if (selectorMatch) {
      currentSelector = selectorMatch[1];
      continue;
    }

    // 检测 CSS 声明
    const declMatch = line.match(/([\w-]+)\s*:\s*([^;]+);/);
    if (declMatch && currentSelector) {
      const property = declMatch[1].trim();
      let value = declMatch[2].trim();

      // 移除行内注释（注释仅用于说明，不影响解析）
      const commentMatch = value.match(/\s*\/\*\s*(.+?)\s*\*\/\s*/);
      let comment = null;
      let expectedToken = null;
      if (commentMatch) {
        comment = commentMatch[1];
        value = value.replace(commentMatch[0], '').trim();
        // 提取期望的 token（如果有）
        const tokenMatch = comment.match(/--ob-[\w-]+/);
        if (tokenMatch) {
          expectedToken = tokenMatch[0];
        }
      }

      declarations.push({
        selector: currentSelector,
        property,
        value,
        expectedToken,
        line: lineNumber,
        comment,
        id: `${currentSelector}-${property}`,
        expectedType, // 记录期望类型
      });
      continue;
    }

    // 检测规则结束
    if (line.includes('}')) {
      currentSelector = null;
      continue;
    }
  }

  return declarations;
}

/**
 * 运行 stylelint 规则并获取结果
 * 必须通过 options.config 传入配置，并指定 configBasedir，否则会走文件解析逻辑加载到项目里的 .stylelintrc 等
 * @param {string} filePath - 测试用例文件路径
 * @returns {Promise<Object>} stylelint 结果
 */
export async function runStylelint(filePath) {
  const ruleConfig = {
    plugins: [useDesignTokens],
    rules: {
      // 禁用可能干扰的默认规则
      'value-keyword-case': null,
      'property-no-unknown': null,
      'declaration-property-value-no-unknown': null,
      'color-hex-case': null,
      'color-hex-length': null,
      'color-named': null,
      'color-no-invalid-hex': null,
      'font-family-no-duplicate-names': null,
      'font-family-no-missing-generic-family-keyword': null,
      'function-calc-no-unspaced-operator': null,
      'function-linear-gradient-no-nonstandard-direction': null,
      'string-no-newline': null,
      'unit-no-unknown': null,
      'keyframe-declaration-no-important': null,
      'declaration-block-no-duplicate-properties': null,
      'declaration-block-no-shorthand-property-overrides': null,
      'block-no-empty': null,
      'comment-no-empty': null,
      'no-duplicate-selectors': null,
      'no-empty-source': null,
      'no-extra-semicolons': null,
      'no-invalid-double-slash-comments': null,
      'ob/use-design-tokens': [
        true,
        {
          tokens: defaultDesignTokens,
          useCSSVariable: true,
          cssVariablePrefix: '',
          disableFix: false,
          useDefaultOBUIToken: true,
          enableWarningForNonTokenValues: true,
        },
      ],
    },
  };

  try {
    const result = await stylelint.lint({
      files: [filePath],
      config: ruleConfig,
      configBasedir: process.cwd(),
      formatter: 'string',
    });
    return result;
  } catch (error) {
    console.error('运行 stylelint 时出错:', error);
    throw error;
  }
}

/**
 * 分析 stylelint 结果，提取实际的替换、跳过、警告
 * @param {Object} stylelintResult - stylelint 结果
 * @param {string} filePath - 测试用例文件路径
 * @returns {Object} 包含实际替换、跳过、警告的数组
 */
export function analyzeStylelintResult(stylelintResult, filePath) {
  const actual = {
    replace: [], // 实际被替换的声明
    skip: [], // 实际被跳过的声明
    warn: [], // 实际被警告的声明
  };

  if (!stylelintResult.results || stylelintResult.results.length === 0) {
    return actual;
  }

  const result = stylelintResult.results[0];
  const warnings = result.warnings || [];

  // 读取文件内容以获取行号信息
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // 解析所有 CSS 声明
  const allDeclarations = [];
  let currentSelector = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测选择器
    const selectorMatch = line.match(/^\.([\w-]+)/);
    if (selectorMatch) {
      currentSelector = selectorMatch[1];
      continue;
    }

    // 检测 CSS 声明
    const declMatch = line.match(/([\w-]+)\s*:\s*([^;]+);/);
    if (declMatch && currentSelector) {
      let value = declMatch[2].trim();
      // 移除行内注释
      const commentMatch = value.match(/\s*\/\*\s*(.+?)\s*\*\/\s*/);
      if (commentMatch) {
        value = value.replace(commentMatch[0], '').trim();
      }

      allDeclarations.push({
        selector: currentSelector,
        property: declMatch[1].trim(),
        value,
        line: i + 1,
        id: `${currentSelector}-${declMatch[1].trim()}`,
      });
      continue;
    }

    // 检测规则结束
    if (line.includes('}')) {
      currentSelector = null;
      continue;
    }
  }

  // 分析警告
  const warnedDeclarations = new Set();
  const replaceDeclarations = new Set();
  const warnDeclarations = new Set();

  for (const warning of warnings) {
    const line = warning.line;
    const declaration = allDeclarations.find((d) => d.line === line);

    if (declaration) {
      warnedDeclarations.add(declaration.id);

      // 判断是替换还是警告
      const warningText = warning.text || '';
      if (
        warning.severity === 'error' &&
        (warningText.includes('避免使用硬编码的值') ||
          warningText.includes('请使用设计 token'))
      ) {
        // 从消息中提取替换后的值（tokenName）
        // 消息格式：`避免使用硬编码的值 "xxx"，请使用设计 token "yyy"`
        const tokenMatch = warningText.match(/请使用设计 token "([^"]+)"/);
        const replacement = tokenMatch ? tokenMatch[1] : null;
        
        actual.replace.push({
          ...declaration,
          replacement, // 记录替换后的值
        });
        replaceDeclarations.add(declaration.id);
      } else if (
        warning.severity === 'warning' ||
        warningText.includes('可能不符合设计规范') ||
        warningText.includes('请确认是否应该使用设计 token')
      ) {
        actual.warn.push(declaration);
        warnDeclarations.add(declaration.id);
      }
    }
  }

  // 找出被跳过的声明（没有警告）
  for (const decl of allDeclarations) {
    if (!warnedDeclarations.has(decl.id)) {
      actual.skip.push(decl);
    }
  }

  return actual;
}

/**
 * 对比期望结果和实际结果
 * @param {Object} expectations - 期望结果
 * @param {Object} actual - 实际结果
 * @returns {Object} 对比结果
 */
export function compareResults(expectations, actual) {
  const comparison = {
    replace: {
      expected: expectations.replace.length,
      actual: actual.replace.length,
      matches: [],
      missing: [], // 期望替换但实际未替换
      unexpected: [], // 实际替换但未期望替换
    },
    skip: {
      expected: expectations.skip.length,
      actual: actual.skip.length,
      matches: [],
      missing: [], // 期望跳过但实际未跳过
      unexpected: [], // 实际跳过但未期望跳过
    },
    warn: {
      expected: expectations.warn.length,
      actual: actual.warn.length,
      matches: [],
      missing: [], // 期望警告但实际未警告
      unexpected: [], // 实际警告但未期望警告
    },
  };

  // 对比替换
  const expectedReplaceIds = new Set(expectations.replace.map((e) => e.id));
  const actualReplaceIds = new Set(actual.replace.map((a) => a.id));

  for (const expected of expectations.replace) {
    if (actualReplaceIds.has(expected.id)) {
      comparison.replace.matches.push(expected);
    } else {
      comparison.replace.missing.push(expected);
    }
  }

  for (const actualItem of actual.replace) {
    if (!expectedReplaceIds.has(actualItem.id)) {
      comparison.replace.unexpected.push(actualItem);
    }
  }

  // 对比跳过
  const expectedSkipIds = new Set(expectations.skip.map((e) => e.id));
  const actualSkipIds = new Set(actual.skip.map((a) => a.id));

  for (const expected of expectations.skip) {
    if (actualSkipIds.has(expected.id)) {
      comparison.skip.matches.push(expected);
    } else {
      comparison.skip.missing.push(expected);
    }
  }

  // 「意外跳过」不包含「期望替换但未替换」和「期望警告但未警告」的项，避免重复显示
  const expectedReplaceIdsForSkip = new Set(expectations.replace.map((e) => e.id));
  const expectedWarnIdsForSkip = new Set(expectations.warn.map((e) => e.id));
  for (const actualItem of actual.skip) {
    if (
      !expectedSkipIds.has(actualItem.id) &&
      !expectedReplaceIdsForSkip.has(actualItem.id) &&
      !expectedWarnIdsForSkip.has(actualItem.id)
    ) {
      comparison.skip.unexpected.push(actualItem);
    }
  }

  // 对比警告
  const expectedWarnIds = new Set(expectations.warn.map((e) => e.id));
  const actualWarnIds = new Set(actual.warn.map((a) => a.id));

  for (const expected of expectations.warn) {
    if (actualWarnIds.has(expected.id)) {
      comparison.warn.matches.push(expected);
    } else {
      comparison.warn.missing.push(expected);
    }
  }

  for (const actualItem of actual.warn) {
    if (!expectedWarnIds.has(actualItem.id)) {
      comparison.warn.unexpected.push(actualItem);
    }
  }

  return comparison;
}

/**
 * 格式化测试结果输出
 * @param {string} category - 测试类别名称
 * @param {Object} comparison - 对比结果
 * @param {Object} actual - 实际结果（用于获取替换后的值）
 * @returns {string} 格式化的输出
 */
export function formatTestResult(category, comparison, actual = { replace: [], warn: [] }) {
  const output = [];
  output.push(`\n${'='.repeat(60)}`);
  output.push(`测试类别: ${category.toUpperCase()}`);
  output.push(`${'='.repeat(60)}`);

  // 计算成功率
  const totalExpected =
    comparison.replace.expected +
    comparison.skip.expected +
    comparison.warn.expected;
  const totalMatches =
    comparison.replace.matches.length +
    comparison.skip.matches.length +
    comparison.warn.matches.length;
  const successRate = totalExpected > 0 ? (totalMatches / totalExpected) * 100 : 100;

  output.push(`\n总体成功率: ${successRate.toFixed(2)}% (${totalMatches}/${totalExpected})`);

  // 替换结果
  output.push(`\n【期望替换】`);
  output.push(
    `  成功: ${comparison.replace.matches.length}/${comparison.replace.expected}`,
  );
  if (comparison.replace.matches.length > 0) {
    output.push(`  成功用例:`);
    for (const item of comparison.replace.matches) {
      // 从 actual.replace 中查找对应的 replacement
      const actualItem = actual.replace.find((a) => a.id === item.id);
      let replacement = actualItem?.replacement || 'token';
      // 如果 replacement 只包含 var(--xxx)，提取 token 名称；如果包含其他内容（复合属性），保留完整值但提取 token
      if (replacement.includes('var(')) {
        // 如果整个值就是 var(--xxx)，只显示 token 名称
        if (/^var\([^)]+\)$/.test(replacement.trim())) {
          const varMatch = replacement.match(/var\(([^)]+)\)/);
          replacement = varMatch ? varMatch[1] : replacement;
        } else {
          // 复合属性（如 "2px solid var(--ob-blue-4)"），提取所有 token 名称
          replacement = replacement.replace(/var\(([^)]+)\)/g, (match, token) => token);
        }
      }
      output.push(
        `    ✓ 行 ${item.line}: .${item.selector} { ${item.property}: ${item.value}; } -> .${item.selector} { ${item.property}: ${replacement}; }`,
      );
    }
  }
  if (comparison.replace.missing.length > 0) {
    output.push(`  失败 (期望替换但未替换):`);
    for (const item of comparison.replace.missing) {
      output.push(
        `    - 行 ${item.line}: .${item.selector} { ${item.property}: ${item.value}; }`,
      );
    }
  }
  if (comparison.replace.unexpected.length > 0) {
    output.push(`  意外 (未期望替换但被替换):`);
    for (const item of comparison.replace.unexpected) {
      const actualItem = actual.replace.find((a) => a.id === item.id);
      let replacement = actualItem?.replacement || 'token';
      if (replacement.includes('var(')) {
        if (/^var\([^)]+\)$/.test(replacement.trim())) {
          const varMatch = replacement.match(/var\(([^)]+)\)/);
          replacement = varMatch ? varMatch[1] : replacement;
        } else {
          replacement = replacement.replace(/var\(([^)]+)\)/g, (match, token) => token);
        }
      }
      output.push(
        `    - 行 ${item.line}: .${item.selector} { ${item.property}: ${item.value}; } -> .${item.selector} { ${item.property}: ${replacement}; }`,
      );
    }
  }

  // 跳过结果
  output.push(`\n【期望跳过】`);
  output.push(`  成功: ${comparison.skip.matches.length}/${comparison.skip.expected}`);
  if (comparison.skip.missing.length > 0) {
    output.push(`  失败 (期望跳过但未跳过):`);
    for (const item of comparison.skip.missing) {
      output.push(
        `    - 行 ${item.line}: .${item.selector} { ${item.property}: ${item.value}; }`,
      );
    }
  }
  if (comparison.skip.unexpected.length > 0) {
    output.push(`  意外 (未期望跳过但被跳过):`);
    for (const item of comparison.skip.unexpected) {
      output.push(
        `    - 行 ${item.line}: .${item.selector} { ${item.property}: ${item.value}; }`,
      );
    }
  }

  // 警告结果
  output.push(`\n【期望警告】`);
  output.push(`  成功: ${comparison.warn.matches.length}/${comparison.warn.expected}`);
  if (comparison.warn.matches.length > 0) {
    output.push(`  成功用例:`);
    for (const item of comparison.warn.matches) {
      output.push(
        `    ✓ 行 ${item.line}: .${item.selector} { ${item.property}: ${item.value}; } -> 当前值 "${item.value}" 可能不符合设计规范`,
      );
    }
  }
  if (comparison.warn.missing.length > 0) {
    output.push(`  失败 (期望警告但未警告):`);
    for (const item of comparison.warn.missing) {
      output.push(
        `    - 行 ${item.line}: .${item.selector} { ${item.property}: ${item.value}; }`,
      );
    }
  }
  if (comparison.warn.unexpected.length > 0) {
    output.push(`  意外 (未期望警告但被警告):`);
    for (const item of comparison.warn.unexpected) {
      output.push(
        `    - 行 ${item.line}: .${item.selector} { ${item.property}: ${item.value}; } -> 当前值 "${item.value}" 可能不符合设计规范`,
      );
    }
  }

  return output.join('\n');
}

/**
 * 运行单个测试用例（新结构：按类别目录，每个目录下有 replace.css/skip.css/warn.css）
 * @param {string} category - 测试类别名称
 * @returns {Promise<Object>} 测试结果
 */
export async function runSingleTest(category) {
  const categoryDir = join(__dirname, 'cases', category);
  const replaceFile = join(categoryDir, 'replace.css');
  const skipFile = join(categoryDir, 'skip.css');
  const warnFile = join(categoryDir, 'warn.css');

  // 收集所有期望结果
  const expectations = {
    replace: [],
    skip: [],
    warn: [],
  };

  // 收集所有文件内容（用于合并运行 stylelint）
  const allFiles = [];
  const fileTypeMap = new Map(); // 记录每个文件路径对应的期望类型

  // 解析各类型文件（如果存在）
  if (existsSync(replaceFile)) {
    const decls = parseTestFile(replaceFile, 'replace');
    expectations.replace = decls;
    allFiles.push(replaceFile);
    fileTypeMap.set(replaceFile, 'replace');
  }

  if (existsSync(skipFile)) {
    const decls = parseTestFile(skipFile, 'skip');
    expectations.skip = decls;
    allFiles.push(skipFile);
    fileTypeMap.set(skipFile, 'skip');
  }

  if (existsSync(warnFile)) {
    const decls = parseTestFile(warnFile, 'warn');
    expectations.warn = decls;
    allFiles.push(warnFile);
    fileTypeMap.set(warnFile, 'warn');
  }

  if (allFiles.length === 0) {
    return {
      category,
      success: false,
      error: `未找到测试文件：${categoryDir} 目录下没有 replace.css/skip.css/warn.css`,
      output: `\n测试类别 ${category} 运行失败: 未找到测试文件\n`,
    };
  }

  try {
    // 分别运行每个文件，然后合并结果（这样行号能准确对应）
    const allActual = {
      replace: [],
      skip: [],
      warn: [],
    };

    for (const filePath of allFiles) {
      const stylelintResult = await runStylelint(filePath);
      const fileActual = analyzeStylelintResult(stylelintResult, filePath);
      
      // 合并到总结果
      allActual.replace.push(...fileActual.replace);
      allActual.skip.push(...fileActual.skip);
      allActual.warn.push(...fileActual.warn);
    }

      // 对比结果
      const comparison = compareResults(expectations, allActual);

      // 格式化输出（传入 actual 以便显示替换后的值）
      const formattedOutput = formatTestResult(category, comparison, allActual);

    return {
      category,
      success: true,
      comparison,
      output: formattedOutput,
    };
  } catch (error) {
    return {
      category,
      success: false,
      error: error.message,
      output: `\n测试类别 ${category} 运行失败: ${error.message}\n`,
    };
  }
}

