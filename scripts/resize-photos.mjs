/**
 * 갤러리 사진 자동 압축
 *
 * 관리자 화면에서 올린 사진은 휴대폰 카메라 원본 그대로(보통 5000px대,
 * 1~2MB)라서, 화면에 작은 정사각형으로 보여줄 때도 그 큰 용량을 전부
 * 내려받게 됩니다. 사진이 여러 장인 갤러리를 휴대폰 데이터로 열면
 * 느리고 데이터도 많이 씁니다.
 *
 * 이 스크립트는 홈페이지를 만들 때(빌드 시점)마다 자동으로 실행되어
 * 화면에 보이기 충분한 크기로 줄이고 압축합니다.
 *
 * ⚠️ 원본은 그대로 GitHub 저장소에 안전하게 보관됩니다.
 *    이 스크립트는 방문자에게 내려주는 사본만 줄일 뿐,
 *    원본 파일을 손상시키거나 지우지 않습니다.
 *    (매번 저장소의 원본에서 다시 만들기 때문입니다)
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";
import sharp from "sharp";

const TARGET_DIR = "site/public/images/uploads";
// 화면에서 사진을 가장 크게 볼 때(전체 화면 감상)도 충분한 크기
const MAX_DIMENSION = 1920;

const HANDLERS = {
  ".jpg": (img) => img.jpeg({ quality: 80 }),
  ".jpeg": (img) => img.jpeg({ quality: 80 }),
  ".png": (img) => img.png({ compressionLevel: 9 }),
  ".webp": (img) => img.webp({ quality: 80 }),
};

function walk(dir) {
  let files = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files; // 업로드 폴더가 아직 없으면 조용히 넘어갑니다
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      files = files.concat(walk(full));
    } else if (HANDLERS[extname(name).toLowerCase()]) {
      files.push(full);
    }
  }
  return files;
}

async function processOne(path) {
  const ext = extname(path).toLowerCase();
  const original = readFileSync(path);
  const encode = HANDLERS[ext];

  let image = sharp(original, { failOn: "none" });
  const meta = await image.metadata();

  const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);
  if (longEdge > MAX_DIMENSION) {
    image = image.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  // sharp 는 다시 인코딩할 때 위치정보(EXIF)를 기본적으로 넣지 않으므로
  // strip-exif 스크립트와 별개로 한 번 더 안전하게 처리됩니다.
  const result = await encode(image).toBuffer();

  // 다시 압축한 결과가 원본보다 크면(이미 작은 사진 등) 원본을 유지합니다
  if (result.length >= original.length) return { changed: false, saved: 0 };

  writeFileSync(path, result);
  return { changed: true, saved: original.length - result.length };
}

const files = walk(TARGET_DIR);
if (files.length === 0) {
  console.log("[resize-photos] 처리할 사진이 없습니다.");
} else {
  let changed = 0;
  let savedBytes = 0;
  for (const f of files) {
    try {
      const r = await processOne(f);
      if (r.changed) {
        changed++;
        savedBytes += r.saved;
      }
    } catch (err) {
      // 사진 하나가 손상되어 있어도 나머지 빌드는 계속되어야 합니다
      console.warn(`[resize-photos] 처리 실패, 원본 유지: ${f}`, err.message);
    }
  }
  const savedMB = (savedBytes / 1024 / 1024).toFixed(1);
  console.log(
    `[resize-photos] 사진 ${files.length}개 확인, 압축 ${changed}개, 절약 ${savedMB}MB`,
  );
}
