#!/usr/bin/env node
/*
  OPTIONAL: self-host the photos instead of loading them from Google Drive.
  Run on your own computer (Drive must be reachable):

    npm install --no-save sharp
    node tools/fetch-photos.mjs            # download + convert + rewrite the data files
    node tools/fetch-photos.mjs --dry-run  # just list what would happen

  For every { drive: id } photo in students.js and albums.js it downloads the image once,
  re-encodes it to WebP at 400/800/1600 px (re-encoding strips EXIF/GPS metadata), saves it
  under Assets/images/cast/ or Assets/images/album/, and rewrites the entry to { src: ... }.

  Trade-off (see docs/PRIVACY.md): self-hosted photos are faster and don't break when Drive
  changes, but removing one completely later means rewriting git history, not just
  unsharing it in Drive.
*/
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DRY = process.argv.includes("--dry-run");
const WIDTHS = [400, 800, 1600];
// Overridable for testing against a local server.
const DRIVE = process.env.YB_DRIVE_BASE || "https://drive.google.com/thumbnail";

const sharp = DRY ? null : (await import("sharp")).default;

function load(rel, name) {
  const ctx = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), ctx);
  return ctx.window[name];
}

async function download(id) {
  const res = await fetch(`${DRIVE}?id=${encodeURIComponent(id)}&sz=w1600`, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") || "";
  if (!type.startsWith("image/")) throw new Error(`not an image (${type}) — is the file shared as "Anyone with the link"?`);
  return Buffer.from(await res.arrayBuffer());
}

async function convert(buffer, base) {
  const abs = path.join(ROOT, base);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const meta = await sharp(buffer).rotate().metadata();
  for (const w of WIDTHS) {
    await sharp(buffer).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 76, effort: 5 }).toFile(`${abs}-${w}.webp`);
  }
  return meta;
}

async function run(file, items, baseFor) {
  let text = fs.readFileSync(path.join(ROOT, file), "utf8");
  let changed = 0;
  for (const [i, item] of items.entries()) {
    const id = item.photo ? item.photo.drive : item.drive;
    if (!id) continue;
    const base = baseFor(item, i);
    if (DRY) {
      console.log(`  would fetch ${id} → ${base}-{${WIDTHS.join(",")}}.webp`);
      continue;
    }
    try {
      await convert(await download(id), base);
      text = text.replace(`{ drive: ${JSON.stringify(id)} }`, `{ src: ${JSON.stringify(base)} }`);
      changed++;
      console.log(`  ✓ ${base}`);
    } catch (e) {
      console.log(`  ✗ ${id}: ${e.message} (kept on Drive)`);
    }
  }
  if (!DRY && changed) fs.writeFileSync(path.join(ROOT, file), text);
  console.log(`${file}: ${DRY ? "dry run" : `${changed} photo(s) now self-hosted`}`);
}

const students = load("Assets/js/data/students.js", "YB_STUDENTS");
const album = load("Assets/js/data/albums.js", "YB_ALBUM");
await run("Assets/js/data/students.js", students, (s) => `Assets/images/cast/no-${s.no}`);
await run("Assets/js/data/albums.js", album, (_, i) => `Assets/images/album/frame-${String(i + 1).padStart(2, "0")}`);
if (!DRY) console.log("\nNext: node tools/check.mjs, then review and commit Assets/images/cast/, Assets/images/album/ and the data files.");
