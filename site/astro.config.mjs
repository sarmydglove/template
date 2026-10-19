// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './site-url.mjs';

export default defineConfig({
  // 배포 주소는 site-url.mjs 한 곳에서 관리합니다.
  site: SITE_URL,
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      // 관리자 화면은 검색엔진에 나올 필요가 없어 제외합니다.
      filter: (page) => !page.includes('/admin'),
    }),
  ],
});
