#!/usr/bin/env node
/*
  Regenerates the optimized images in Assets/images/opt/ from the original files.

    npm install --no-save sharp
    node tools/optimize-images.mjs

  Why the originals were so heavy: intro.png and content.png are mostly transparent, but the
  invisible (alpha = 0) pixels still carried noisy colour data from the export, which defeats
  compression. We zero those pixels first, then resize and encode to AVIF + WebP.
*/
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const IMG = path.join(ROOT, "Assets/images");
const OUT = path.join(IMG, "opt");
fs.mkdirSync(OUT, { recursive: true });

const AVIF = { quality: 52, effort: 6 };
const WEBP = { quality: 74, alphaQuality: 90, effort: 6 };

// Zero the RGB of fully transparent pixels so encoders don't waste bits on invisible noise.
async function clean(input, extract) {
  let img = sharp(input).ensureAlpha();
  if (extract) img = img.extract(extract);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) data[i] = data[i + 1] = data[i + 2] = 0;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function variants(name, buffer, widths, formats = ["avif", "webp"]) {
  const meta = await sharp(buffer).metadata();
  const made = [];
  for (const w of widths) {
    const width = Math.min(w, meta.width);
    for (const fmt of formats) {
      const file = path.join(OUT, `${name}-${w}.${fmt}`);
      const pipe = sharp(buffer).resize({ width, withoutEnlargement: true });
      await (fmt === "avif" ? pipe.avif(AVIF) : fmt === "jpg" ? pipe.jpeg({ quality: 78, mozjpeg: true }) : pipe.webp(WEBP)).toFile(file);
      made.push(`${path.basename(file)} ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
    }
  }
  const h = Math.round((meta.height * Math.min(widths[widths.length - 1], meta.width)) / meta.width);
  console.log(`${name} (${meta.width}×${meta.height}, largest ${Math.min(widths.at(-1), meta.width)}×${h}):\n  ` + made.join("\n  "));
}

// Class photo polaroid (hero) and the two-photo contact strip.
await variants("intro", await clean(path.join(IMG, "intro.png")), [640, 1080, 1600]);
await variants("content", await clean(path.join(IMG, "content.png")), [640, 1080, 1600]);

// Video poster: a 16:9 crop from the middle of the class photo, clear of the testimonial cards.
await variants("poster", await clean(path.join(IMG, "intro.png"), { left: 1042, top: 190, width: 1235, height: 695 }), [640, 1235]);

// "Our glorious leader" cutout (source is only 411px wide).
await variants("leader", await clean(path.join(IMG, "DSC06614-removebg 1.png")), [411]);

// Wordmark for the nav ticket stub and the credits.
await variants("logo", await clean(path.join(IMG, "meh_entahlah_copy.png")), [240, 480], ["webp"]);

// Sponsor logos for the end credits (bin-mepo.svg is a PNG wrapped in a 620 KB SVG).
for (const [name, file] of [
  ["sponsor-mepo", "sponsors/mepo.png"],
  ["sponsor-bin-mepo", "sponsors/bin-mepo.svg"],
  ["sponsor-rpl", "sponsors/rpl.jpg"],
  ["sponsor-wk", "sponsors/wk.png"],
]) {
  const src = await sharp(path.join(IMG, file), { density: 72 }).resize({ width: 640 }).png().toBuffer();
  await variants(name, await clean(src), [160, 320], ["webp"]);
}

// Home-screen icon from the hand-drawn SVG favicon.
await sharp(path.join(IMG, "favicon.svg"), { density: 300 }).resize(180, 180).png({ compressionLevel: 9 }).toFile(path.join(IMG, "apple-touch-icon.png"));
console.log(`apple-touch-icon.png ${(fs.statSync(path.join(IMG, "apple-touch-icon.png")).size / 1024).toFixed(1)} KB`);
