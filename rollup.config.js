import commonjs from '@rollup/plugin-commonjs';
import { defineConfig } from 'rollup';
import dts from 'rollup-plugin-dts';
import ts from 'rollup-plugin-typescript2';

const config = defineConfig([
  // ESLint 独立入口
  {
    input: 'src/eslint.ts',
    output: [
      {
        file: 'dist/eslint.js',
        format: 'esm',
      },
      {
        file: 'dist/eslint.cjs',
        format: 'cjs',
      },
    ],
    plugins: [ts(), commonjs()],
    external: [
      'eslint',
      'eslint-flat-config-utils',
      '@eslint/js',
      '@typescript-eslint/parser',
      'typescript-eslint',
      'eslint-plugin-import',
      'eslint-plugin-react',
      'eslint-plugin-react-hooks',
      'eslint-plugin-prettier',
      'eslint-plugin-prettier/recommended',
      'eslint-config-prettier',
      'prettier',
    ],
  },

  // Stylelint 独立入口
  {
    input: 'src/stylelint.ts',
    output: [
      {
        file: 'dist/stylelint.js',
        format: 'esm',
      },
      {
        file: 'dist/stylelint.cjs',
        format: 'cjs',
      },
    ],
    plugins: [ts(), commonjs()],
    external: [
      'stylelint',
      'stylelint-config-standard',
      'stylelint-config-recommended-less',
      'stylelint-less',
      'postcss-less',
    ],
  },

  // 主入口（保持向后兼容）
  {
    input: ['src/index.ts'],
    output: [
      {
        dir: 'dist',
        format: 'esm',
      },
      {
        file: 'dist/index.cjs',
        format: 'cjs',
      },
    ],
    plugins: [ts(), commonjs()],
  },

  // 生成 .d.ts 文件的配置
  {
    input: 'src/eslint.ts',
    output: {
      file: 'dist/eslint.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
  },
  {
    input: 'src/stylelint.ts',
    output: {
      file: 'dist/stylelint.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
  },
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      format: 'esm',
    },
    plugins: [dts()],
  },
]);

export default config;
