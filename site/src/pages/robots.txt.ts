import type { APIRoute } from "astro";
import { SITE_URL } from "../../site-url.mjs";

export const GET: APIRoute = () => {
  // 한글 도메인은 검색엔진 로봇이 그대로 못 읽을 수 있어 punycode(영문)로 바꿔 씁니다
  const origin = new URL(SITE_URL).origin;
  const body = `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${origin}/sitemap-index.xml
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
