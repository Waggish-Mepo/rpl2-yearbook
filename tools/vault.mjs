#!/usr/bin/env node
/*
  RPL XII-2 class vault tool — uses the exact same crypto as the website
  (Assets/js/vault-core.js).

    node tools/vault.mjs gen                 print a fresh random passphrase
    node tools/vault.mjs seal [--generate]   private/vault.plain.json  →  Assets/js/data/vault.js
    node tools/vault.mjs open [--stdout]     Assets/js/data/vault.js   →  private/vault.plain.json
    node tools/vault.mjs reseal [--generate] change the passphrase (asks for the old one, then the new one)
    node tools/vault.mjs check               confirm a passphrase opens the vault

  Passphrases come from a hidden prompt, or from the environment variables
  YB_VAULT_PASSPHRASE (current) and YB_VAULT_NEW_PASSPHRASE (reseal).
  Never pass a passphrase as a command-line argument, and never commit private/.
*/
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import readline from "node:readline";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CORE = path.join(ROOT, "Assets/js/vault-core.js");
const VAULT = path.join(ROOT, "Assets/js/data/vault.js");
const PLAIN = path.join(ROOT, "private/vault.plain.json");

await import(pathToFileURL(CORE).href);
const core = globalThis.YBVaultCore;

const [cmd, ...flags] = process.argv.slice(2);
const has = (f) => flags.includes(f);

function die(msg) {
  console.error("✗ " + msg);
  process.exit(1);
}

function askHidden(question) {
  if (!process.stdin.isTTY) die("no terminal to prompt on — set YB_VAULT_PASSPHRASE / YB_VAULT_NEW_PASSPHRASE instead");
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    rl._writeToOutput = (s) => {
      if (!muted) rl.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function currentPassphrase() {
  return process.env.YB_VAULT_PASSPHRASE || (await askHidden("Current vault passphrase: "));
}

async function newPassphrase(envName) {
  if (has("--generate")) {
    const p = core.generatePassphrase();
    console.log("\n  New passphrase (write it down — it is shown only once):\n\n      " + p + "\n");
    return p;
  }
  if (process.env[envName]) return process.env[envName];
  const a = await askHidden("New passphrase (5–6 random words is a good choice): ");
  const b = await askHidden("Repeat it: ");
  if (a !== b) die("passphrases don't match");
  return a;
}

function readVault() {
  if (!fs.existsSync(VAULT)) die(`no vault at ${path.relative(ROOT, VAULT)}`);
  const ctx = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(VAULT, "utf8"), ctx);
  return ctx.window.YB_VAULT;
}

function writeVault(sealed) {
  const out = `/*
  RPL XII-2 class vault — written by tools/vault.mjs. Do not edit by hand.
  AES-256-GCM, key from PBKDF2-SHA-256 (${sealed.iter.toLocaleString("en")} iterations).
  Holds the full birth dates and birthplaces; unlock with the class passphrase.
  See docs/PRIVACY.md.
*/
window.YB_VAULT = ${JSON.stringify(sealed)};
`;
  fs.writeFileSync(VAULT, out);
}

async function sealAndVerify(data, pass) {
  const sealed = await core.seal(data, pass);
  const back = await core.open(sealed, pass);
  if (JSON.stringify(back) !== JSON.stringify(data)) die("round-trip check failed — nothing written");
  writeVault(sealed);
  console.log(`✓ sealed ${Object.keys(data).length} entries → ${path.relative(ROOT, VAULT)} (round-trip verified)`);
}

switch (cmd) {
  case "gen":
    console.log(core.generatePassphrase());
    break;

  case "seal": {
    if (!fs.existsSync(PLAIN)) die(`no plaintext at ${path.relative(ROOT, PLAIN)} (run tools/migrate.mjs or "open" first)`);
    const data = JSON.parse(fs.readFileSync(PLAIN, "utf8"));
    await sealAndVerify(data, await newPassphrase("YB_VAULT_PASSPHRASE"));
    console.log(`  Delete the plaintext when you're done:  rm ${path.relative(ROOT, PLAIN)}`);
    break;
  }

  case "open": {
    const data = await core.open(readVault(), await currentPassphrase()).catch((e) => die(e.message));
    if (has("--stdout")) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      fs.mkdirSync(path.dirname(PLAIN), { recursive: true });
      fs.writeFileSync(PLAIN, JSON.stringify(data, null, 2) + "\n", { mode: 0o600 });
      console.log(`✓ decrypted ${Object.keys(data).length} entries → ${path.relative(ROOT, PLAIN)} (gitignored)`);
    }
    break;
  }

  case "reseal": {
    const data = await core.open(readVault(), await currentPassphrase()).catch((e) => die(e.message));
    await sealAndVerify(data, await newPassphrase("YB_VAULT_NEW_PASSPHRASE"));
    console.log("  Old copies of the vault stay in git history and still open with the old passphrase —");
    console.log("  see docs/PRIVACY.md for how to purge them.");
    break;
  }

  case "check": {
    const data = await core.open(readVault(), await currentPassphrase()).catch((e) => die(e.message));
    console.log(`✓ passphrase OK — ${Object.keys(data).length} entries`);
    break;
  }

  default:
    console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("*/")[0].replace(/^#!.*\n\/\*/, "").trimEnd());
    process.exit(cmd ? 1 : 0);
}
