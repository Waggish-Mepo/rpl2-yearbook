#!/usr/bin/env node
/*
  Pre-commit guard for the yearbook.   Run:  node tools/check.mjs

    1. PII guard   — published files must not contain NIS-style numbers, full M/D/YYYY dates
                     or the old sensitive field names.
    2. Data check  — students.js / albums.js load and only use the allowed public fields.
    3. Vault test  — the shared crypto seals/opens, rejects wrong or tampered input, and
                     never reuses a salt/IV (uses a throwaway passphrase, not the real one).
*/
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
let failures = 0;
const ok = (msg) => console.log("✓ " + msg);
const bad = (msg) => {
  failures++;
  console.error("✗ " + msg);
};

// ---- 1. PII guard ---------------------------------------------------------
const SKIP_DIRS = new Set([".git", "node_modules", "private", "test-results", "tools", "docs"]);
const TEXT = /\.(html|js|mjs|css|json|svg|txt|webmanifest)$/i;
const RULES = [
  { name: "old sensitive field name", re: /\b(nis|date_of_birth|place_of_birth)\b/ },
  { name: "NIS-style number", re: /\b1[0-9]{7}\b/ },
  { name: "full M/D/YYYY date", re: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/ },
];
// The encrypted vault is random base64 by design; legacy files are removed by the redesign.
const ALLOW = new Set(["Assets/js/data/vault.js", "Assets/js/data/profiles.js", "Assets/js/profile_script.js"]);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name));
      continue;
    }
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).split(path.sep).join("/");
    if (!TEXT.test(rel) || ALLOW.has(rel) || /\.min\.(js|css)$/.test(rel)) continue;
    if (fs.statSync(full).size > 2_000_000) continue;
    const lines = fs.readFileSync(full, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const rule of RULES) {
        if (rule.re.test(line)) bad(`${rel}:${i + 1} — ${rule.name}`);
      }
    });
  }
}
const before = failures;
walk(ROOT);
if (failures === before) ok("no PII patterns in published files");

// ---- 2. Data check --------------------------------------------------------
function load(rel, name) {
  const ctx = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), ctx, { filename: rel });
  return ctx.window[name];
}

const ALLOWED = ["no", "name", "nickname", "birthday", "hobby", "quote", "message", "instagram", "photo"];
const DRIVE_ID = /^[\w-]{25,60}$/;
const students = load("Assets/js/data/students.js", "YB_STUDENTS");
const album = load("Assets/js/data/albums.js", "YB_ALBUM");

if (!Array.isArray(students) || students.length === 0) bad("students.js did not define YB_STUDENTS");
else {
  const seen = new Set();
  for (const s of students) {
    const extra = Object.keys(s).filter((k) => !ALLOWED.includes(k));
    if (extra.length) bad(`student #${s.no}: non-public field(s) ${extra.join(", ")}`);
    if (seen.has(s.no)) bad(`duplicate absen number ${s.no}`);
    seen.add(s.no);
    if (typeof s.name !== "string" || !s.name) bad(`student #${s.no}: missing name`);
    if (s.birthday !== null) {
      const k = Object.keys(s.birthday || {}).sort().join(",");
      if (k !== "d,m") bad(`student #${s.no}: birthday must be { d, m } or null`);
    }
    if (!Array.isArray(s.instagram)) bad(`student #${s.no}: instagram must be an array`);
    if (s.photo && !(DRIVE_ID.test(s.photo.drive || "") || typeof s.photo.src === "string")) {
      bad(`student #${s.no}: photo must be { drive: id } or { src: path }`);
    }
  }
  ok(`${students.length} students, public fields only`);
}
if (!Array.isArray(album) || album.some((p) => !(DRIVE_ID.test(p.drive || "") || typeof p.src === "string"))) {
  bad("albums.js entries must be { drive: id } or { src: path }");
} else ok(`${album.length} album photos`);

// ---- 3. Vault self-test ---------------------------------------------------
await import(pathToFileURL(path.join(ROOT, "Assets/js/vault-core.js")).href);
const core = globalThis.YBVaultCore;
const sample = { 1: { d: 1, m: 1, y: 2000, pob: "Contoh" } };
const pass = core.generatePassphrase();
const messy = "  " + pass.toLowerCase().replace(/-/g, " ").replace(/0/g, "O").replace(/1/g, "l") + " ";

const expectFail = async (label, fn) => {
  try {
    await fn();
    bad("vault: " + label + " should have failed");
  } catch {
    /* expected */
  }
};

const a = await core.seal(sample, pass);
const b = await core.seal(sample, pass);
if (a.salt === b.salt || a.iv === b.iv || a.ct === b.ct) bad("vault: two seals reused salt/IV/ciphertext");
if (JSON.stringify(await core.open(a, pass)) !== JSON.stringify(sample)) bad("vault: round-trip mismatch");
if (JSON.stringify(await core.open(a, messy)) !== JSON.stringify(sample)) bad("vault: forgiving input rejected");
await expectFail("wrong passphrase", () => core.open(a, "definitely-not-it-000"));
await expectFail("tampered header", () => core.open({ ...a, iter: a.iter + 1 }, pass));
await expectFail("tampered ciphertext", () => core.open({ ...a, ct: "A" + a.ct.slice(1) }, pass));
await expectFail("weak KDF", () => core.seal(sample, pass, { iter: 1000 }));
await expectFail("short passphrase", () => core.seal(sample, "short"));
const real = load("Assets/js/data/vault.js", "YB_VAULT");
if (!real || real.v !== 1 || real.iter < core.MIN_ITER) bad("data/vault.js is missing or uses a weak KDF");
if (failures === 0) ok("vault crypto: round-trip, forgiving input, tamper + wrong-pass rejection, fresh salt/IV");

console.log(failures ? `\n${failures} problem(s) found` : "\nAll checks passed.");
process.exit(failures ? 1 : 0);
