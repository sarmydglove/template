# 구세군 대구사랑교회 홈페이지 — 작업 규칙

이 문서는 이 저장소에서 세션이 어디서 열리든(로컬 / 원격·클라우드) 자동으로
Claude가 읽는 지침입니다. 매번 대화로 다시 설명할 필요 없이 여기부터
확인하세요. 배경 설명은 [PLAN.md](PLAN.md) 참고.

## 계정

- **GitHub / Cloudflare 모두 `sarmydglove` 계정만 사용** (2026-08-03 이전 완료).
  `hahadark` 계정은 이제 이 프로젝트와 무관 — 어떤 명령 출력에서든 다시 보이면
  뭔가 잘못 설정된 신호다.
- 작업 전 `gh auth status`, `wrangler whoami`로 활성 계정이 sarmydglove인지
  확인할 것. 계정이 맞아도 "리소스가 응답한다"는 게 "올바른 리소스"라는
  뜻은 아니다 — git 연동/최근 배포 이력이 있는 쪽이 진짜다.

## 커밋 · 푸시 전 항상

1. `git fetch origin` 먼저 실행. 사용자가 `/admin` CMS로 실시간 편집하는
   경우가 잦아 원격이 로컬보다 앞서 있을 수 있다. 새 커밋이 있으면
   `git diff <old>..origin/main -- <파일>`로 무엇이 바뀌었는지 확인하고,
   사용자가 방금 저장한 콘텐츠를 덮어쓰거나 잃지 않도록 한다.
2. `git restore --staged --worktree -- site/public/images/uploads/` 로,
   빌드 과정에서 생기는 이미지 재처리 부산물을 커밋에서 제외한다.
3. 커밋 메시지는 한국어로, 무엇을 왜 바꿨는지 한 줄로.

## 배포

- `main`에 push하면 Cloudflare Workers Build가 git 연동으로 자동 배포한다
  (`npm run build` → `wrangler deploy`). **수동으로 `wrangler deploy`를
  직접 실행하지 말 것** — 과거 이걸로 `workers_dev`가 꺼지며 실제 운영
  사이트가 내려간 사고가 있었다. `wrangler.jsonc`에는 반드시
  `"workers_dev": true`를 명시적으로 유지한다.
- 배포 확인은 `https://xn--9d0b2bap432eplhg8q55ag39j.kr/` (퓨니코드,
  `구세군대구사랑교회.kr`)에서 curl로 폴링.
- Cloudflare "Variables and Secrets" (`GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`)
  가 새 배포 후 간헐적으로 초기화되는 현상이 있었다. 관리자 로그인이
  503/Unexpected Error를 내면 이것부터 의심하고 재등록 안내.

## 공개 콘텐츠 방침 (반드시 준수)

- **연락처는 이메일만** (`sarmydglove@gmail.com`). 전화번호는 게재하지 않는다.
- 절대 게재 금지: 헌금자 명단, 봉사위원 명단, 사관 개인 휴대폰 번호,
  사관의 휴가·부재 일정(다른 지역 회의 참석 등으로 교회를 비우는 날짜 포함),
  개인 신상사 언급, 다른 교회의 순수 내부 행사, 헌금 계좌번호.
- 주보에서 소식/행사를 site/src/content/notices에 옮길 때는 위 기준으로
  거른다. 애매하면 사용자에게 확인.
- 사진 갤러리는 기본 비공개 — 관리자가 직접 공개로 바꿔야 노출된다.

## 명칭 통일

- 어디서든 **"구세군 대구사랑교회"** 하나로 통일해서 표기 ("구세군대구사랑영문"
  등 옛 명칭 사용 금지). 유튜브에서 자동으로 가져오는 옛 영상 제목은
  `unifyChurchName()` (site/src/lib/youtube.ts, worker/index.js,
  scripts/update-video-cache.mjs)로 표시할 때만 자동 치환한다.
- '영문(營門)'이라는 구세군 전통 용어 자체는 교회 소개 페이지(`about.astro`)
  용어 안내에만 설명용으로 남겨둔다.

## 기타

- 도메인은 한글 도메인(`구세군대구사랑교회.kr`)이라 퓨니코드
  (`xn--9d0b2bap432eplhg8q55ag39j.kr`)로 정규화해야 하는 곳이 있다
  (robots.txt, admin config.yml의 base_url 등) — `new URL(SITE_URL).origin`
  패턴을 그대로 따른다.
- 이 사이트는 목사님(비개발자)이 후임자에게 관리자 권한을 넘길 것을 전제로
  설계됐다. 교회 정보 대부분은 `site/src/data/settings/*.json`으로 분리해
  CMS에서 편집 가능하게 한다 — 새 기능을 만들 때도 이 원칙을 따른다.
