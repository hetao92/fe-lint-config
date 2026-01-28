# OceanBase lint 规范

中文 | [English](./README.md)

- [快速开始](#快速开始)
- [ESLint 配置说明](#eslint)
- [Stylelint 配置说明](#stylelint)
  - [设计 Token 插件](#设计-token-插件)

## 快速开始

### 交互式配置向导（推荐）

使用交互式命令快速配置 ESLint 或 Oxlint：

```bash
npx @oceanbase/lint-config setup-lint
```

该命令会引导您：
1. 选择使用 ESLint、Oxlint 或两者共存
2. 选择项目类型（TypeScript、React）
3. 选择功能模块（Prettier、Import 规则等）
4. 自动生成配置文件
5. 自动安装依赖
6. 自动添加 npm scripts

详细说明请查看 [bin/README.md](./bin/README.md)

### 手动安装

#### 安装

```bash
npm i --save-dev eslint prettier stylelint @oceanbase/lint-config stylelint-config-recommended-less stylelint-config-standard stylelint-less
```

#### 限制

- 要求 ESLint v9.5.0+
- 要求 Node.js (^18.18.0, ^20.9.0, or >=21.1.0)

## ESLint

### 已启用插件
- [eslint-plugin-import](https://github.com/benmosher/eslint-plugin-import)
- [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react)
- [eslint-plugin-react-hooks](https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks)
- [eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier)

### 使用

在项目根目录创建 `eslint.config.mjs` 文件

```js
// eslint.config.mjs
import { OBEslintCfg } from '@oceanbase/lint-config'

export default OBEslintCfg()
```

### 在 `package.json` 中添加脚本

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

### Lint 提交

在 `package.json` 中添加以下内容以在每次提交前执行 lint 和自动修复
```bash
npm i -save-dev lint-staged husky
```

```json
{
  "scripts": {
    "prepare": "husky install",
  },
 "lint-staged": {
    "./src/**/*.{js,jsx,ts,tsx}": [
      "npx prettier --write",
      "npm run lint:fix"
    ],
  },
}
```

### 自定义

```js
// eslint.config.js
import OBEslintCfg from '@oceanbase/lint-config'

export default OBEslintCfg({
  // 配置默认插件
  // 以下模块默认开启，可以通过配置 `false` 关闭
  typescript: true,
  prettier: true,
  import: true,
  react: true,

  // `.eslintignore` 在 flat config 不生效，需要手动配置 ignores
  // 以下为默认忽略的文件夹
  ignores: [
    '**/fixtures',
    // ...globs
  ]
})
```

`OBEslintCfg` 也可以接受任意数量的自定义配置覆盖参数：

```js
// eslint.config.js
import OBEslintCfg from '@oceanbase/lint-config'

export default OBEslintCfg(
  {
    // OBEslintCfg 配置
  },
  // 从第二个参数开始，使用 ESLint 的 Flat Configs 提供任意个自定义配置
  {
    ignores: ['**/test'],
    files: ['**/*.ts'],
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
    },
  },
  {
    rules: {},
  },
)
```

### 规则覆盖

所有规则只在特定模块下配置，当然也支持在第一个参数之后的配置中覆盖默认配置

```js
// eslint.config.js
import OBEslintCfg from '@oceanbase/lint-config'

export default OBEslintCfg(
  {
    // typescript、react、prettier、import 等默认模块均支持这样覆盖规则
    typescript: {
      overrides: {
        '@typescript-eslint/no-unused-vars': 'off',
      },
    }
  },
  {
    // 也可以在后续配置对象内覆盖
    files: ['**/*.vue'],
    rules: {
      'vue/operator-linebreak': ['error', 'before'],
    },
  },
)
```

### 基于 TypeScript 的类型信息规则

你可以通过配置 tsconfigPath 参数来开启基于 TypeScript 的[类型信息规则](https://typescript-eslint.io/linting/typed-linting/)

> [!NOTE]
> 类型信息规则检查相对比较严格，可依据各自项目情况判断是否开启
> 此外，开启类型信息规则对校验性能会有影响，视项目仓库大小而定

```js
import OBEslintCfg from '@oceanbase/lint-config'

export default OBEslintCfg({
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
})
```


### 添加新规则

1. 在 `src/rules` 下添加规则
2. 在 `src/configs` 下创建配置文件，并将规则加入配置
3. 在 `src/factory.ts` 中添加使用方式，暴露一些配置参数

### 查看已启用的规则

以下命令需要在项目根目录下执行
```bash
npx @eslint/config-inspector
```

## IDE 支持 (保存时自动修复)

<details>
<summary>🟦 VS Code 支持</summary>

<br>

安装 VS Code ESLint [插件](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

在 `.vscode/settings.json` 中添加以下配置:
```jsonc
{
  // Disable the default formatter, use eslint instead
  "prettier.enable": false,
  "editor.formatOnSave": false,

  // Auto fix
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },

  // Enable eslint for all supported languages
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue",
    "html",
    "markdown",
    "json",
    "jsonc",
    "yaml",
    "toml",
    "xml",
    "gql",
    "graphql",
    "astro",
    "svelte",
    "css",
    "less",
    "scss",
    "pcss",
    "postcss"
  ]
}
```

</details>

## Stylelint

### 已启用插件

- [stylelint-config-recommended-less](https://github.com/stylelint-less/stylelint-less)
- [stylelint-config-standard](https://github.com/stylelint/stylelint-config-standard)

### 使用

在项目根目录创建 `.stylelintrc.mjs` 文件

```js
// .stylelintrc.mjs
import { OBStylelintCfg } from '@oceanbase/lint-config'

export default OBStylelintCfg()
```

### 在 `package.json` 中添加脚本

```json
{
  "scripts": {
    "lint:css": "stylelint '**/*.{less,css}'",
    "lint:fix:css": "stylelint '**/*.{less,css}' --fix"
  }
}
```

### Lint 提交

在 `package.json` 中添加以下内容以在每次提交前执行 lint 和自动修复

```json
{
  "scripts": {
    "prepare": "husky install",
  },
 "lint-staged": {
    "./src/**/*.{less,css}": [
      "npx stylelint --fix"
    ]
  },
}
```

### 规则覆盖

Stylelint 支持通过 `extends`、`overrides` 添加自定义插件或覆盖规则：

```js
// .stylelintrc.mjs
import { OBStylelintCfg } from '@oceanbase/lint-config/stylelint'

export default OBStylelintCfg({
  extends: ['xxx插件'],
  overrides: {
    'selector-class-pattern': null,
  },
})
```

### 设计 Token 插件

内置 **设计 Token** 插件（规则名：`ob/use-design-tokens`），可在执行 lint 时检查样式文件中的硬编码颜色、尺寸等，并替换为设计 token（如 CSS 变量），保证与设计规范一致。

#### 功能概览

| 能力       | 说明 |
|------------|------|
| 检测与替换 | 识别写死的颜色（hex/rgb/rgba）、尺寸、圆角、阴影等，并替换为配置的 token |
| 默认 Token | 内置 OceanBase UI 设计 token，可直接启用；也可关闭默认集仅用自定义 |
| 自动修复   | 使用 `stylelint --fix` 时对可替换的值自动改写为 token |
| 未命中提示 | 可开启「对未在 token 中的值发出警告」，便于发现遗漏 |

#### 启用方式

在 `OBStylelintCfg` 中开启 `designTokens.enabled` 并按需配置：

```js
// .stylelintrc.mjs
import { OBStylelintCfg } from '@oceanbase/lint-config/stylelint'

export default OBStylelintCfg({
  designTokens: {
    enabled: true,
    // 是否合并内置 OceanBase UI token，默认 true
    useDefaultOBUIToken: true,
    // 自定义 token 映射（会与默认 token 合并，同名覆盖）
    tokens: {
      '--my-border': '#cdd5e4',
      '--my-primary': '#0d6cf2',
    },
    // 输出为 CSS 变量格式，默认 true
    useCSSVariable: true,
    // CSS 变量前缀，如 'ob' 会生成 var(--ob-xxx)
    cssVariablePrefix: 'ob',
    // 忽略的属性
    ignoreProperties: [],
    // 忽略的值（正则字符串数组）
    ignoreValues: [],
    // 是否禁用自动修复
    disableFix: false,
    // 是否对未使用 token 的值发出警告
    enableWarningForNonTokenValues: true,
  },
})
```

仅使用自定义 token、不启用内置 OceanBase UI token 时：

```js
export default OBStylelintCfg({
  designTokens: {
    enabled: true,
    useDefaultOBUIToken: false,
    tokens: {
      colorBorder: '#cdd5e4',
      colorPrimary: '#0d6cf2',
    },
    useCSSVariable: true,
    cssVariablePrefix: 'my',
  },
})
```

#### 单独使用插件

若项目只使用 Stylelint 且希望单独引用设计 Token 插件，可从 `@oceanbase/lint-config/stylelint` 引入规则。不传 `tokens` 且 `useDefaultOBUIToken` 为默认 `true` 时，会使用内置 OceanBase UI token；也可传入 `tokens` 做覆盖或仅用自定义 token（`useDefaultOBUIToken: false`）：

```js
// .stylelintrc.mjs
import { useDesignTokens } from '@oceanbase/lint-config/stylelint'

export default {
  plugins: [useDesignTokens],
  rules: {
    'ob/use-design-tokens': [
      true,
      {
        useDefaultOBUIToken: true, // 默认 true，即使用内置 token
        tokens: {},               // 可选，自定义覆盖
        useCSSVariable: true,
        cssVariablePrefix: 'ob',
      },
    ],
  },
}
```

更多说明见 [Design Token 插件方案（Monorepo）](./docs/DESIGN_TOKEN_PLUGIN_MONOREPO.md)。