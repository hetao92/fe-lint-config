# OceanBase Lint Standards

English | [中文](./README-zh-CN.md)

- [Quick Start](#quick-start)
- [ESLint Configuration](#eslint)
- [Stylelint Configuration](#stylelint)
  - [Design Token Plugin](#design-token-plugin)

## Quick Start

### Interactive Setup (Recommended)

Use the interactive command to configure ESLint or Oxlint:

```bash
npx @oceanbase/lint-config setup-lint
```

This will guide you to:
1. Choose ESLint, Oxlint, or both
2. Select project type (TypeScript, React)
3. Select features (Prettier, Import rules, etc.)
4. Generate config files
5. Install dependencies
6. Add npm scripts

See [bin/README.md](./bin/README.md) for details.

### Manual Installation

#### Install

```bash
npm i --save-dev eslint prettier stylelint @oceanbase/lint-config stylelint-config-recommended-less stylelint-config-standard stylelint-less
```

#### Requirements

- ESLint v9.5.0+
- Node.js (^18.18.0, ^20.9.0, or >=21.1.0)

## ESLint

### Enabled Plugins

- [eslint-plugin-import](https://github.com/benmosher/eslint-plugin-import)
- [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react)
- [eslint-plugin-react-hooks](https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks)
- [eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier)

### Usage

Create an `eslint.config.mjs` file in your project root:

```js
// eslint.config.mjs
import { OBEslintCfg } from '@oceanbase/lint-config'

export default OBEslintCfg()
```

### Add Scripts to `package.json`

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

### Lint on Commit

Add the following to `package.json` to run lint and auto-fix on each commit:

```bash
npm i --save-dev lint-staged husky
```

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "./src/**/*.{js,jsx,ts,tsx}": [
      "npx prettier --write",
      "npm run lint:fix"
    ]
  }
}
```

### Customization

```js
// eslint.config.js
import OBEslintCfg from '@oceanbase/lint-config'

export default OBEslintCfg({
  // Default plugins; set to false to disable
  typescript: true,
  prettier: true,
  import: true,
  react: true,
  // .eslintignore is not used in flat config; configure ignores here
  ignores: [
    '**/fixtures'
    // ...globs
  ]
})
```

`OBEslintCfg` also accepts any number of custom config overrides:

```js
// eslint.config.js
import OBEslintCfg from '@oceanbase/lint-config'

export default OBEslintCfg(
  {
    // OBEslintCfg options
  },
  // From the second argument onward, use ESLint Flat Configs
  {
    ignores: ['**/test'],
    files: ['**/*.ts'],
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^_' }]
    }
  },
  {
    rules: {}
  }
)
```

### Rule Overrides

Rules are scoped per module and can be overridden in the first argument or in later config objects:

```js
// eslint.config.js
import OBEslintCfg from '@oceanbase/lint-config'

export default OBEslintCfg(
  {
    typescript: {
      overrides: {
        '@typescript-eslint/no-unused-vars': 'off'
      }
    }
  },
  {
    files: ['**/*.vue'],
    rules: {
      'vue/operator-linebreak': ['error', 'before']
    }
  }
)
```

### TypeScript Type Information Rules

You can enable [type-aware rules](https://typescript-eslint.io/linting/typed-linting/) by setting `tsconfigPath`:

> [!NOTE]
> Type-aware rules are stricter; enable based on your project needs. They may also affect performance depending on repository size.

```js
import OBEslintCfg from '@oceanbase/lint-config'

export default OBEslintCfg({
  typescript: {
    tsconfigPath: 'tsconfig.json'
  }
})
```

### Adding New Rules

1. Add rules under `src/rules`
2. Add them to a config under `src/configs`
3. Expose options in `src/factory.ts` if needed

### View Enabled Rules

From the project root:

```bash
npx @eslint/config-inspector
```

### IDE Support (Auto-Fix on Save)

<details>
<summary>🟦 VS Code</summary>

<br>

Install the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).

Add to `.vscode/settings.json`:

```jsonc
{
  "prettier.enable": false,
  "editor.formatOnSave": false,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },
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

### Enabled Plugins

- [stylelint-config-recommended-less](https://github.com/stylelint-less/stylelint-less)
- [stylelint-config-standard](https://github.com/stylelint/stylelint-config-standard)

### Usage

Create a `.stylelintrc.mjs` file in your project root:

```js
// .stylelintrc.mjs
import { OBStylelintCfg } from '@oceanbase/lint-config'

export default OBStylelintCfg()
```

### Add Scripts to `package.json`

```json
{
  "scripts": {
    "lint:css": "stylelint '**/*.{less,css}'",
    "lint:fix:css": "stylelint '**/*.{less,css}' --fix"
  }
}
```

### Lint on Commit

Add to `package.json` to run stylelint on commit:

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "./src/**/*.{less,css}": [
      "npx stylelint --fix"
    ]
  }
}
```

### Rule Overrides

You can add custom plugins via `extends` and override rules via `overrides`:

```js
// .stylelintrc.mjs
import { OBStylelintCfg } from '@oceanbase/lint-config'

export default OBStylelintCfg({
  extends: ['some-plugin'],
  overrides: {
    'selector-class-pattern': null
  }
})
```

### Design Token Plugin

The built-in **Design Token** plugin (rule: `ob/use-design-tokens`) checks style files for hardcoded colors, dimensions, etc., and can replace them with design tokens (e.g. CSS variables) so styles stay aligned with your design system.

#### Overview

| Feature | Description |
|--------|-------------|
| Detect & replace | Finds hardcoded colors (hex/rgb/rgba), dimensions, radius, shadow, etc., and replaces with configured tokens |
| Default tokens | OceanBase UI design tokens are included; you can enable them or use only your own |
| Auto-fix | `stylelint --fix` rewrites replaceable values to tokens |
| Warnings | Optional warnings for values that don’t match any token |

#### Enabling

Turn on `designTokens.enabled` in `OBStylelintCfg` and configure as needed:

```js
// .stylelintrc.mjs
import { OBStylelintCfg } from '@oceanbase/lint-config/stylelint'

export default OBStylelintCfg({
  designTokens: {
    enabled: true,
    // Merge built-in OceanBase UI tokens, default true
    useDefaultOBUIToken: true,
    // Custom token map (merged with defaults, same key overrides)
    tokens: {
      '--my-border': '#cdd5e4',
      '--my-primary': '#0d6cf2'
    },
    // Output as CSS variables, default true
    useCSSVariable: true,
    // CSS variable prefix, e.g. 'ob' → var(--ob-xxx)
    cssVariablePrefix: 'ob',
    ignoreProperties: [],
    ignoreValues: [],
    disableFix: false,
    enableWarningForNonTokenValues: true
  }
})
```

To use only your own tokens (no built-in OceanBase UI set):

```js
export default OBStylelintCfg({
  designTokens: {
    enabled: true,
    useDefaultOBUIToken: false,
    tokens: {
      colorBorder: '#cdd5e4',
      colorPrimary: '#0d6cf2'
    },
    useCSSVariable: true,
    cssVariablePrefix: 'my'
  }
})
```

#### Using the Plugin Standalone

If you only use Stylelint and want to use the Design Token plugin on its own, import the rule from `@oceanbase/lint-config/stylelint`. With `useDefaultOBUIToken: true` (default) and no `tokens`, the built-in OceanBase UI tokens are used; pass `tokens` to override or set `useDefaultOBUIToken: false` to use only your own tokens:

```js
// .stylelintrc.mjs
import { useDesignTokens } from '@oceanbase/lint-config/stylelint'

export default {
  plugins: [useDesignTokens],
  rules: {
    'ob/use-design-tokens': [
      true,
      {
        useDefaultOBUIToken: true, // default: use built-in tokens
        tokens: {},                // optional overrides
        useCSSVariable: true,
        cssVariablePrefix: 'ob'
      }
    ]
  }
}
```

For more details, see [Design Token Plugin (Monorepo)](./docs/DESIGN_TOKEN_PLUGIN_MONOREPO.md).
