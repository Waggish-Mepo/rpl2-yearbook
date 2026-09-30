/*
  Class vault crypto — shared by the site (Assets/js/cast.js) and tools/vault.mjs,
  so sealing and opening can never drift apart.

  AES-256-GCM with a key derived by PBKDF2-SHA-256 (≥ 600,000 iterations).
  The header (v, kdf, iter, salt) is authenticated as additional data, so a
  tampered header fails exactly like a wrong passphrase.
*/
(function (root) {
  "use strict";

  var VERSION = 1;
  var KDF = "PBKDF2-SHA-256";
  var MIN_ITER = 600000;
  var MAX_ITER = 5000000;
  var CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  var enc = new TextEncoder();
  var dec = new TextDecoder();

  function vaultError(code, message) {
    var e = new Error(message);
    e.code = code;
    return e;
  }

  function subtle() {
    var c = root.crypto;
    if (!c || !c.subtle) {
      throw vaultError("NO_CRYPTO", "Web Crypto is unavailable here (it needs https:// or localhost).");
    }
    return c.subtle;
  }

  // Forgiving input: case, spaces, dashes and look-alike characters don't matter.
  // Applied identically when sealing and opening, so it costs no entropy in practice.
  function normalize(pass) {
    return String(pass)
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[\s\-_.]+/g, "")
      .replace(/o/g, "0")
      .replace(/[il]/g, "1");
  }

  function toB64(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }

  function fromB64(b64) {
    var s = atob(b64);
    var out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }

  function aad(h) {
    return enc.encode(JSON.stringify([h.v, h.kdf, h.iter, h.salt]));
  }

  async function deriveKey(pass, salt, iter, usages) {
    var s = subtle();
    var base = await s.importKey("raw", enc.encode(normalize(pass)), "PBKDF2", false, ["deriveKey"]);
    return s.deriveKey(
      { name: "PBKDF2", hash: "SHA-256", salt: salt, iterations: iter },
      base,
      { name: "AES-GCM", length: 256 },
      false,
      usages
    );
  }

  // Salt and IV are always fresh — they can't be passed in, so a nonce can't be reused.
  async function seal(data, pass, opts) {
    var iter = (opts && opts.iter) || MIN_ITER;
    if (iter < MIN_ITER || iter > MAX_ITER) throw vaultError("WEAK_KDF", "iterations must be between " + MIN_ITER + " and " + MAX_ITER);
    if (normalize(pass).length < 12) throw vaultError("WEAK_PASSPHRASE", "passphrase is too short (min. 12 characters)");
    var salt = root.crypto.getRandomValues(new Uint8Array(16));
    var iv = root.crypto.getRandomValues(new Uint8Array(12));
    var header = { v: VERSION, kdf: KDF, iter: iter, salt: toB64(salt) };
    var key = await deriveKey(pass, salt, iter, ["encrypt"]);
    var ct = await subtle().encrypt(
      { name: "AES-GCM", iv: iv, additionalData: aad(header), tagLength: 128 },
      key,
      enc.encode(JSON.stringify(data))
    );
    return { v: header.v, kdf: header.kdf, iter: header.iter, salt: header.salt, iv: toB64(iv), ct: toB64(new Uint8Array(ct)) };
  }

  async function open(vault, pass) {
    if (!vault || vault.v !== VERSION || vault.kdf !== KDF) throw vaultError("BAD_FORMAT", "unknown vault format");
    if (!(vault.iter >= MIN_ITER && vault.iter <= MAX_ITER)) throw vaultError("BAD_FORMAT", "unexpected key-derivation cost");
    var key = await deriveKey(pass, fromB64(vault.salt), vault.iter, ["decrypt"]);
    var pt;
    try {
      pt = await subtle().decrypt(
        { name: "AES-GCM", iv: fromB64(vault.iv), additionalData: aad(vault), tagLength: 128 },
        key,
        fromB64(vault.ct)
      );
    } catch (e) {
      throw vaultError("BAD_PASSPHRASE", "wrong passphrase (or the vault file was altered)");
    }
    return JSON.parse(dec.decode(pt));
  }

  // 16 Crockford base32 characters = 80 bits, e.g. "7KQM-9XTD-2HPA-VR4C".
  function generatePassphrase() {
    var bytes = root.crypto.getRandomValues(new Uint8Array(16));
    var out = "";
    for (var i = 0; i < 16; i++) {
      out += CROCKFORD[bytes[i] & 31];
      if (i % 4 === 3 && i < 15) out += "-";
    }
    return out;
  }

  root.YBVaultCore = {
    seal: seal,
    open: open,
    normalize: normalize,
    generatePassphrase: generatePassphrase,
    MIN_ITER: MIN_ITER,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
