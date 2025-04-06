import { defineConfig } from 'astro/config';

export default defineConfig({
  base: '/xuexi/',     // 仓库名一定要正确！
  output: 'static',
  trailingSlash: 'always' // ✅ 解决刷新 404 问题
});
