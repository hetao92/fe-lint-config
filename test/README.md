# 统一测试框架

这是一个用于测试 `use-design-tokens` 规则的统一测试框架，提供了标准化的测试用例组织和执行方式。

## 概述

测试框架按**类别 + 类型**组织测试用例，每个类别一个目录，每个目录下按期望类型分为三个文件：

- **颜色属性** (`color/`) - 测试 color, background-color, border-color 等
- **字体属性** (`font/`) - 测试 font-size, font-weight, line-height 等
- **间距属性** (`spacing/`) - 测试 margin, padding, gap 等
- **圆角属性** (`radius/`) - 测试 border-radius 等
- **阴影属性** (`shadow/`) - 测试 box-shadow, text-shadow 等
- **尺寸属性** (`dimension/`) - 测试 width, height, border-width 等
- **边框属性** (`border/`) - 测试 border, border-color 等
- **背景属性** (`background/`) - 测试 background, background-color 等

## 测试文件结构

每个类别目录下有三个文件，**期望类型由文件名决定**，无需解析注释：

```
test/cases/
  color/
    replace.css    ← 期望被替换的用例
    skip.css      ← 期望被跳过的用例
    warn.css      ← 期望被警告的用例
  background/
    replace.css
    skip.css
    warn.css
  ...
```

每个文件只包含同一类型的用例，注释仅用于说明（不影响解析）：

```css
/* replace.css - 期望被替换 */
.color-replace {
  color: #0d6cf2; /* 应被替换为 --ob-blue-4 */
}

/* skip.css - 期望被跳过 */
.color-skip {
  color: transparent; /* 应被跳过：透明色 */
}

/* warn.css - 期望被警告 */
.color-warning {
  color: #abcdef; /* 应被警告：有颜色令牌但未匹配 */
}
```

## 运行测试

### 运行单个测试类别

```bash
npm run test <category>
# 例如：
npm run test color
npm run test spacing
```

或者直接运行：

```bash
node test/run-test.js color
```

### 运行所有测试

```bash
npm run test:all
# 或者直接运行
node test/run-all-tests.js
```

### 测试结果输出

测试结果会显示：

- **总体成功率**: 所有测试用例的成功百分比
- **期望替换**: 成功替换的数量 / 期望替换的数量，以及失败的详细信息
- **期望跳过**: 成功跳过的数量 / 期望跳过的数量，以及失败的详细信息
- **期望警告**: 成功警告的数量 / 期望警告的数量，以及失败的详细信息
- **失败详情**: 列出所有失败的测试用例，包括行号和具体内容

### 汇总报告

运行所有测试时，会输出：

- 每个类别的测试结果（成功率和统计）
- 总体成功率
- 失败类别数
- 详细的失败信息（包括失败的行内容）

## 测试框架功能

- **自动解析**: 自动解析测试用例文件，识别期望的行为
- **自动统计**: 自动计算各类别测试的数量和成功率
- **结果对比**: 将实际结果与期望结果进行精确对比
- **详细报告**: 显示每个测试的详细警告信息和失败原因
- **总体汇总**: 提供所有测试的整体统计信息
- **失败定位**: 精确显示失败测试的行号和内容

## 创建新测试

要添加新的测试类别，只需：

1. 在 `test/cases/` 目录下创建新的类别目录（如 `newcategory/`）
2. 在该目录下创建 `replace.css`、`skip.css`、`warn.css` 三个文件（如果某类型没有用例，可以不创建）
3. 在每个文件中编写对应类型的测试用例
4. 在 `test/run-all-tests.js` 的 `categories` 数组中添加新的类别名称

## 优势

- **模块化**: 每个属性类别独立测试，易于维护
- **标准化**: 统一的注释标记和测试结构
- **可维护**: 易于添加新的测试用例
- **准确性**: 清晰的期望与实际结果对比
- **全面性**: 覆盖各种场景（替换、警告、跳过）
- **可单独运行**: 支持单独运行某个类别的测试
- **详细报告**: 提供失败测试的详细信息和行号定位