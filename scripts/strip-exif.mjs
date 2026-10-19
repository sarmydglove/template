/**
 * 사진 위치정보(GPS) 자동 제거
 *
 * 관리자 화면에서 사진을 올리면 site/public/images/uploads 에 원본 그대로
 * 저장됩니다. 휴대폰으로 찍은 사진에는 촬영 위치(GPS 좌표)가 남아있는
 * 경우가 많은데, 교회·아이들 사진과 함께 공개되면 안전 문제가 됩니다.
 *
 * 이 스크립트는 홈페이지를 만들 때(빌드 시점)마다 자동으로 실행되어
 * 올라온 사진에서 위치정보를 포함한 촬영 정보(EXIF)를 지웁니다.
 * 사진 화질에는 영향이 없습니다.
 *
 * ⚠️ 현재 JPEG(.jpg/.jpeg) 사진만 처리합니다. 휴대폰 사진 대부분이
 *    JPEG이지만, 만약 PNG나 HEIC로 올리신 경우 이 스크립트가 처리하지
 *    못하니 되도록 JPEG(일반적인 사진 형식)으로 올려주세요.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import piexif from "piexifjs";

const TARGET_DIR = "site/public/images/uploads";
const JPEG_EXT = new Set([".jpg", ".jpeg"]);

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
    } else if (JPEG_EXT.has(extname(name).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

function stripOne(path) {
  const original = readFileSync(path);
  const binary = original.toString("binary");

  let stripped;
  try {
    stripped = piexif.remove(binary);
  } catch {
    // 촬영 정보가 이미 없는 사진 등은 그대로 두어도 안전합니다
    return "skip";
  }

  const result = Buffer.from(stripped, "binary");
  if (result.equals(original)) return "skip";

  writeFileSync(path, result);
  return "cleaned";
}

const files = walk(TARGET_DIR);
if (files.length === 0) {
  console.log("[strip-exif] 처리할 사진이 없습니다.");
} else {
  let cleaned = 0;
  for (const f of files) {
    if (stripOne(f) === "cleaned") cleaned++;
  }
  console.log(
    `[strip-exif] 사진 ${files.length}개 확인, 위치정보 제거 ${cleaned}개`,
  );
}
