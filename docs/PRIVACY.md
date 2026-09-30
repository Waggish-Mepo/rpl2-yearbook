# Privacy & the class vault

The yearbook used to publish every classmate's **NIS, full date of birth and birthplace**
to anyone who opened the site (and to anyone who reads this repository). Together with a
full name and a photo, that's exactly the set of facts used for identity checks and
account recovery. This redesign fixes that at the source, not just on screen, because
hiding a field in the UI doesn't help when the data file itself is public.

## What is public now

| Data | Where | Who can see it |
|---|---|---|
| Name, nickname, hobby, quote, pesan, Instagram, photo | `Assets/js/data/students.js` | Everyone |
| Birthday **day + month** (e.g. "16 Mei") | `students.js` | Everyone (not shown for #15 and #30, who never filled in the form) |
| **Full birth date + birthplace** | `Assets/js/data/vault.js` (encrypted) | Only people with the class passphrase |
| **NIS** | — | **Deleted.** It was never displayed; it was only a liability. |

The site also sets `noindex, noimageindex` (search engines are asked not to list the
pages or images), loads no trackers, sends no referrer to Google Drive, only loads the
YouTube player after you click play (via `youtube-nocookie.com`), and ships a strict
Content-Security-Policy.

## How the vault works

- The full birth dates and birthplaces are encrypted with **AES-256-GCM**. The key comes
  from the class passphrase through **PBKDF2-SHA-256 with 600,000 iterations**, so every
  guess costs an attacker real compute.
- Unlocking happens entirely in the visitor's browser. The passphrase is never sent
  anywhere; the decrypted data stays in memory and is gone when the tab closes.
- The same code (`Assets/js/vault-core.js`) is used by the website and by
  `tools/vault.mjs`, so they can't disagree.
- Typing is forgiving: upper/lower case, spaces, dashes, and `O`/`0`, `I`/`L`/`1`
  are treated the same.

**What it protects against:** casual visitors, scrapers, search engines, anyone browsing
the repo.
**What it does not protect against:** someone who has the passphrase (they can copy the
data), and a *weak* passphrase. The encrypted file is public forever, so it can be
attacked offline. Use a long random passphrase, like the generated one or 5–6 random words.

## Everyday tasks

```bash
node tools/check.mjs                  # run before every commit: PII guard + data + vault self-test

# change public data (names, quotes, photos…)
#   edit Assets/js/data/students.js, then run the check above

# change vault data (birth dates / birthplaces)
node tools/vault.mjs open             # → private/vault.plain.json (gitignored)
#   edit private/vault.plain.json
node tools/vault.mjs seal             # asks for a passphrase, writes Assets/js/data/vault.js
rm private/vault.plain.json

# change the passphrase
node tools/vault.mjs reseal           # asks for the old one, then the new one
node tools/vault.mjs reseal --generate   # …or let it generate a strong one

node tools/vault.mjs check            # confirm a passphrase works
```

Passphrases are read from a hidden prompt (or the `YB_VAULT_PASSPHRASE` /
`YB_VAULT_NEW_PASSPHRASE` environment variables). Never type one as a command-line
argument, never put one in a file inside the repo (except the gitignored `private/`
folder), and share it only in the class's private group chat.

**Removing a person** (e.g. someone asks to be taken down): delete their entry from
`students.js`, `open` → delete their entry → `seal` the vault, and remove or unshare
their photo on Google Drive. Photos that were self-hosted (see below) also need a
history rewrite to be fully gone.

## ⚠️ One-time owner checklist: purge the old data

Removing the fields from today's files does **not** remove them from git history, from
the upstream repo, from forks, or from caches. Until the history is scrubbed, the old
plaintext stays downloadable, and the vault only protects anything after that.

1. **Rotate the passphrase before merging.** The first passphrase was generated in a
   chat session, so treat it as temporary. On the `claude/eager-curie-udxzcj` branch run
   `node tools/vault.mjs reseal` with a passphrase only you choose (5–6 random words),
   run `node tools/vault.mjs check`, and commit. Resealing does *not* revoke older
   copies of `vault.js` in history, which is why steps 2 and 4 matter.
2. **Squash-merge, then delete the branch.** `master` then only contains the final vault;
   the earlier ciphertext only survives in dangling objects (purged in step 4). Then
   open a pull request to `Waggish-Mepo/rpl2-yearbook`, which serves the live site on
   GitHub Pages.
3. **Rewrite history** on this repo *and* on upstream, with
   [`git filter-repo`](https://github.com/newren/git-filter-repo). The expressions below
   redact only the sensitive values wherever they appear. This covers both the current
   `Assets/js/data/profiles.js` and the older `Data/profiles.js` from April 2022,
   without touching ordinary words like "Bogor" elsewhere.

   ```bash
   git clone --mirror https://github.com/altf4m88/rpl2-yearbook.git && cd rpl2-yearbook.git
   cat > ../pii.txt <<'EOF'
   regex:(\bnis\s*:\s*)"[^"]*"==>\1"REDACTED"
   regex:(\bdate_of_birth\s*:\s*)"[^"]*"==>\1"REDACTED"
   regex:(\bplace_of_birth\s*:\s*)"[^"]*"==>\1"REDACTED"
   regex:("nis"\s*:\s*)"[^"]*"==>\1"REDACTED"
   EOF
   git filter-repo --replace-text ../pii.txt
   # verify: must print 0
   git log --all -p | grep -cE '\b(nis|date_of_birth|place_of_birth)\s*:\s*"[^R"]'
   git push --force --mirror origin
   ```

   Every commit SHA changes, so collaborators must re-clone.
4. **Ask GitHub Support to purge cached data** for the whole fork network
   (github.com/contact → "Remove sensitive data"). Name both repos and the file paths
   `Assets/js/data/profiles.js` and `Data/profiles.js`. This is the only way to remove
   `refs/pull/*` history and commits that stay reachable by SHA through forks.
5. **Forks.** Ask every fork owner to delete their fork or re-fork after the scrub, and to
   **turn off GitHub Pages on any fork that still serves the old site** (check
   `nsilpia/rpl2-yearbook`, which was reported to have Pages on with an April 2022 snapshot).
6. **Archives.** Check `web.archive.org` for snapshots of the live site's
   `Assets/js/data/profiles.js` and request removal (email info@archive.org with the URLs).
7. **Search engines (optional).** `noindex` only takes effect as Google re-crawls. If the
   domain is verified in Google Search Console, its Removals tool is faster.

## Optional: self-host the photos

Right now photos load from Google Drive thumbnails. That keeps the repo small, and anyone
can take a photo down by unsharing it in Drive, but it's slower and it has broken before
(Drive changed its links in 2024). `tools/fetch-photos.mjs` downloads every photo once,
re-encodes it to small WebP files (which also strips EXIF/GPS metadata) and points the data
at the local copies. Run it on your own computer:

```bash
npm install --no-save sharp
node tools/fetch-photos.mjs
node tools/check.mjs
```

The trade-off: once photos are committed, removing one completely means rewriting git
history, not just unsharing a file.

## Font license

The display font "Dillsburg City" is by NoahType, and the font file itself says
**"PERSONAL License – Non Commercial"**. This site is a non-commercial class memorial and
the file is served unmodified, but for certainty buy a web/commercial license from
NoahType or swap it for an open-license font.
