#!/usr/bin/env node
/*
  One-off migration: old Assets/js/data/profiles.js  →  public students.js + private vault plaintext.

  What it does
    - Evaluates the old `const profiles = [...]` with node:vm (no regex scraping).
    - Drops NIS entirely.
    - Public data keeps only day + month of the birthday (non-respondents #15 and #30 get none).
    - Full birth date + birthplace go to private/vault.plain.json (gitignored), to be sealed
      with `node tools/vault.mjs seal`.
    - Cleans text: trims, normalises \r\n, strips stray HTML and wrapping quotes, splits
      multiple Instagram handles, turns "-" into null.
    - Verifies every public day/month against what the old site rendered.

  Usage (already run once — kept for the record; the old file no longer exists):
    git show 79ffdc4:Assets/js/data/profiles.js > /tmp/old-profiles.js
    node tools/migrate.mjs /tmp/old-profiles.js
  (after the history scrub in docs/PRIVACY.md that commit id changes, and the values are gone)
*/
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.resolve(process.argv[2] || path.join(ROOT, "Assets/js/data/profiles.js"));
const OUT_PUBLIC = path.join(ROOT, "Assets/js/data/students.js");
const OUT_PRIVATE = path.join(ROOT, "private/vault.plain.json");

// People who never filled in the form: their details were entered by someone else,
// so nothing about their birthday is published (it stays in the class vault only).
const NON_RESPONDENTS = new Set([15, 30]);

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function fail(msg) {
  console.error("✗ " + msg);
  process.exit(1);
}

// ---- load -----------------------------------------------------------------
const source = fs.readFileSync(SRC, "utf8");
const ctx = vm.createContext({});
vm.runInContext(source + "\n;globalThis.__profiles = profiles;", ctx, { filename: SRC });
const profiles = ctx.__profiles;

if (!Array.isArray(profiles) || profiles.length !== 32) fail(`expected 32 profiles, got ${profiles && profiles.length}`);
const nos = profiles.map((p) => p.no).sort((a, b) => a - b);
if (nos.some((n, i) => n !== i + 1)) fail("absen numbers are not exactly 1..32");

// ---- cleaning helpers -----------------------------------------------------
const isEmpty = (v) => v == null || String(v).trim() === "" || String(v).trim() === "-";

function cleanText(v) {
  if (isEmpty(v)) return null;
  let s = String(v)
    .replace(/\r\s*\n|\r/g, "\n") // "\r\n" and "\r \n" → newline
    .replace(/<[^>]*>/g, "") // stray HTML such as <strong>
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .trim();
  // one layer of wrapping straight quotes — the design adds its own quote marks
  const m = s.match(/^"([\s\S]*)"$/);
  if (m) s = m[1].trim();
  return s || null;
}

function parseMDY(s) {
  const m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{1,4})$/);
  if (!m) fail(`unparseable date "${s}"`);
  const [mo, d, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) fail(`out-of-range date "${s}"`);
  return { d, m: mo, y };
}

function driveId(url) {
  const m = String(url).match(/[?&]id=([\w-]+)/);
  return m ? m[1] : null;
}

function instagram(v) {
  if (isEmpty(v)) return [];
  return String(v)
    .split(/[,\s]+/)
    .map((h) => h.trim().replace(/^@/, ""))
    .filter(Boolean);
}

// ---- transform ------------------------------------------------------------
const students = [];
const vault = {};
const photoIds = [];
const problems = [];

for (const p of [...profiles].sort((a, b) => a.no - b.no)) {
  const dob = parseMDY(p.date_of_birth);
  const id = driveId(p.picture);
  if (id) {
    if (!/^[\w-]{33}$/.test(id)) problems.push(`#${p.no}: suspicious Drive id "${id}"`);
    photoIds.push(id);
  }

  // What the old site showed, e.g. "16 Mei 2004" — used to verify the public day+month.
  const old = new Date(p.date_of_birth).toLocaleDateString("id-ID", {
    year: "numeric", month: "long", day: "numeric",
  });
  const mine = `${dob.d} ${MONTHS[dob.m - 1]}`;
  if (!old.startsWith(mine + " ")) problems.push(`#${p.no}: old site showed "${old}", migrated day+month is "${mine}"`);

  students.push({
    no: p.no,
    name: cleanText(p.name),
    nickname: cleanText(p.nickname),
    birthday: NON_RESPONDENTS.has(p.no) ? null : { d: dob.d, m: dob.m },
    hobby: cleanText(p.hobby),
    quote: cleanText(p.quote),
    message: cleanText(p.message),
    instagram: instagram(p.instagram),
    photo: id ? { drive: id } : null,
  });

  vault[p.no] = { d: dob.d, m: dob.m, y: dob.y, pob: cleanText(p.place_of_birth) };
}

if (photoIds.length !== 31) problems.push(`expected 31 Drive photo ids, got ${photoIds.length}`);
if (problems.length) fail("verification failed:\n  " + problems.join("\n  "));

// ---- write ----------------------------------------------------------------
const lit = (v) => JSON.stringify(v);
const obj = (o) =>
  o == null ? "null" : "{ " + Object.entries(o).map(([k, v]) => `${k}: ${lit(v)}`).join(", ") + " }";

const body = students
  .map((s) =>
    [
      "  {",
      `    no: ${s.no},`,
      `    name: ${lit(s.name)},`,
      `    nickname: ${lit(s.nickname)},`,
      `    birthday: ${obj(s.birthday)},`,
      `    hobby: ${lit(s.hobby)},`,
      `    quote: ${lit(s.quote)},`,
      `    message: ${lit(s.message)},`,
      `    instagram: ${lit(s.instagram)},`,
      `    photo: ${obj(s.photo)},`,
      "  },",
    ].join("\n")
  )
  .join("\n");

const header = `/*
  RPL XII-2 — The Cast (public data)

  PRIVACY RULES — read docs/PRIVACY.md before editing:
    - Never add NIS, birth year, full birth date or birthplace here. Everything in this
      file is public to anyone who opens the site.
    - Full birth dates and birthplaces live encrypted in data/vault.js (class passphrase).

  Fields
    no         absen number (1–32), also the deep link: profile.html#no-12
    birthday   { d, m } day + month only, or null
    instagram  handles without "@"
    photo      { drive: "<Google Drive file id>" }  or  { src: "Assets/images/cast/x.webp" }  or  null

  HOW TO GET A GOOGLE DRIVE FILE ID
    Share link: https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123-_/view?usp=sharing
    The id is the part between /d/ and /view:   1AbCdEfGhIjKlMnOpQrStUvWxYz0123-_
    The file must be shared as "Anyone with the link".
*/
window.YB_STUDENTS = [
${body}
];
`;

fs.writeFileSync(OUT_PUBLIC, header);
fs.mkdirSync(path.dirname(OUT_PRIVATE), { recursive: true });
fs.writeFileSync(OUT_PRIVATE, JSON.stringify(vault, null, 2) + "\n", { mode: 0o600 });

console.log(`✓ ${students.length} students → ${path.relative(ROOT, OUT_PUBLIC)}`);
console.log(`✓ vault plaintext → ${path.relative(ROOT, OUT_PRIVATE)} (gitignored — seal it, then delete it)`);
console.log(`✓ day+month verified against the old rendering for all ${profiles.length}`);
console.log(`  public birthday withheld for non-respondents: #${[...NON_RESPONDENTS].join(", #")}`);
