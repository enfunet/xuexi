import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['dist'],
  },
  {
    // 扩展推荐的 ESLint 和 TypeScript ESLint 规则
    extends: [
      js.configs.recommended,
      'plugin:@typescript-eslint/recommended',
      'plugin:react-hooks/recommended',
    ],
    // 匹配所有 .ts 和 .tsx 文件
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      // 更新到 ECMAScript 2024
      ecmaVersion: 2024,
      sourceType: 'module',
      // 设置全局变量为浏览器环境
      globals: globals.browser,
      // 使用 TypeScript ESLint 解析器
      parser: tseslintParser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tseslint,
    },
    rules: {
      // 展开 React Hooks 推荐规则
      ...reactHooks.configs.recommended.rules,
      // 配置 react-refresh 规则，允许常量导出
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // 可以根据需要添加或修改其他规则
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
];
