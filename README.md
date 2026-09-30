Built with ❤️
by Keluarga Besar RPL 2 Gen 17 SMK Wikrama Bogor

<a href="https://instagram.com/gragamaung_" target="_blank" rel="noopener noreferrer"><img align="center" src="https://img.shields.io/badge/gragamaung-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="gragamaung_" /></a>

# Buku Tahunan
```
██████╗░██████╗░██╗░░░░░  ██╗░░██╗██╗██╗░░░░░░██████╗░
██╔══██╗██╔══██╗██║░░░░░  ╚██╗██╔╝██║██║░░░░░░╚════██╗
██████╔╝██████╔╝██║░░░░░  ░╚███╔╝░██║██║█████╗░░███╔═╝
██╔══██╗██╔═══╝░██║░░░░░  ░██╔██╗░██║██║╚════╝██╔══╝░░
██║░░██║██║░░░░░███████╗  ██╔╝╚██╗██║██║░░░░░░███████╗
╚═╝░░╚═╝╚═╝░░░░░╚══════╝  ╚═╝░░╚═╝╚═╝╚═╝░░░░░░╚══════╝
 ```

 ```
█▄─▀█▄─▄█─▄▄▄▄█▄─██─▄█▄─▄███▄─▄█▄─█─▄█
██─█▄▀─██─██▄─██─██─███─██▀██─███─▄▀██
▀▄▄▄▀▀▄▄▀▄▄▄▄▄▀▀▄▄▄▄▀▀▄▄▄▄▄▀▄▄▄▀▄▄▀▄▄▀

█▄─▀█▄─▄█─▄▄▄▄█─▄▄─█▄─▄▄▀█▄─▄█▄─▀█▄─▄█─▄▄▄▄███
██─█▄▀─██─██▄─█─██─██─██─██─███─█▄▀─██─██▄─███
▀▄▄▄▀▀▄▄▀▄▄▄▄▄▀▄▄▄▄▀▄▄▄▄▀▀▄▄▄▀▄▄▄▀▀▄▄▀▄▄▄▄▄▀▀▀

█▄─▀█▄─▄█─▄▄▄▄█─▄▄─█▄─▄▄─█▄─▄█
██─█▄▀─██─██▄─█─██─██─▄▄▄██─██
▀▄▄▄▀▀▄▄▀▄▄▄▄▄▀▄▄▄▄▀▄▄▄▀▀▀▄▄▄▀
 ```

## The Final Cut

The yearbook is a three-year film about one class:

| Page | What's there |
|---|---|
| `index.html` — **The Trailer** | film-leader intro, camcorder title card, nickname marquee, two scenes, the "Featuring" poster, end credits |
| `profile.html` — **The Cast** | all 32 classmates as polaroids: search, sort, "Siapa hari ini?", character cards with shareable links (`profile.html#no-12`) |
| `album.html` — **Behind the Scenes** | the photo album as a contact sheet with a lightbox (`album.html#f-7`) |

Plain HTML, CSS and JavaScript: no framework, no build step, no trackers. The colours are
the original ones (navy `#1A1A40`, white, grey `#535353`, black).

## Editing

| To change… | Edit | Notes |
|---|---|---|
| a classmate's quote, pesan, hobby, Instagram, photo | `Assets/js/data/students.js` | public, see the comment at the top |
| album photos | `Assets/js/data/albums.js` | one Google Drive id per photo |
| full birth dates / birthplaces | the encrypted class vault | `node tools/vault.mjs open` → edit → `seal` |
| page text | `index.html`, `profile.html`, `album.html` | |
| look and feel | `Assets/css/yearbook.css` | |

**Before every commit:** `node tools/check.mjs`. It blocks NIS-style numbers, full dates
and the old sensitive field names from being published, validates the data, and self-tests
the vault crypto.

**Preview locally:** `npx serve .` (or `python3 -m http.server`), then open the printed URL.
The class vault only unlocks over `https://` or `localhost`.

## Privacy

NIS numbers are gone, birthdays are public only as day + month, and full birth dates and
birthplaces are in an AES-256-GCM vault that opens with the class passphrase (ask the class
group). Pages carry `noindex`, a strict Content-Security-Policy, and load YouTube only after
you press play.

**Owners:** the old data is still in this repository's git history. Please follow the
one-time checklist in [`docs/PRIVACY.md`](docs/PRIVACY.md).

## Tools

| Command | Does |
|---|---|
| `node tools/check.mjs` | PII guard + data validation + vault self-test |
| `node tools/vault.mjs gen \| seal \| open \| reseal \| check` | manage the class vault |
| `node tools/optimize-images.mjs` | rebuild `Assets/images/opt/` (needs `npm i --no-save sharp`) |
| `node tools/fetch-photos.mjs` | optional: self-host the Drive photos as WebP |

Fonts: Poppins (SIL Open Font License, `Assets/font/poppins/OFL.txt`) and Dillsburg City by
NoahType, whose file says *"PERSONAL License – Non Commercial"*. It's used unmodified on this
non-commercial memorial; get a web license from NoahType if that ever changes.

 Sponsored By:

<p align="center">
<img src="Assets/images/sponsors/mepo.png" width="100" alt="Mepo" />
<img src="Assets/images/sponsors/bin-mepo.svg" width="100" alt="BIN Mepo" />
<img src="Assets/images/sponsors/rpl.jpg" width="100" alt="RPL" />
<img src="Assets/images/sponsors/wk.png" width="100" alt="SMK Wikrama Bogor" />
</p>
