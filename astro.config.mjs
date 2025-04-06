import { defineConfig } from 'astro/config';

export default defineConfig({
  base: '/',                 // ✅ Cloudflare 不需要子路径
  output: 'static',
  trailingSlash: 'always'   // ✅ 防止刷新 404
});
