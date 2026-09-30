/*
  The Cast (profile.html): polaroid grid, search, sort, "Siapa hari ini?", the character
  sheet dialog with deep links (#no-12), and the class vault unlock.

  Decrypted vault data lives in memory only and is gone when the tab closes.
*/
(function () {
  "use strict";

  var doc = document;
  var win = window;
  var YB = win.YB;
  if (!YB || doc.body.getAttribute("data-page") !== "cast") return;

  var root = doc.documentElement;
  var students = YB.students();
  var total = students.length;
  var byNo = {};
  students.forEach(function (s) {
    byNo[s.no] = s;
  });

  var grid = doc.querySelector("[data-cast-grid]");
  var countEl = doc.querySelector("[data-cast-count]");
  var emptyEl = doc.querySelector("[data-cast-empty]");
  var input = doc.getElementById("cast-search");
  var sheet = doc.querySelector("[data-sheet]");
  var vaultDialog = doc.querySelector("[data-vault]");

  var cards = {};
  var order = "no";
  var query = "";
  var current = null; // absen number shown in the sheet
  var pushed = false; // did we add a history entry when opening?
  var vaultData = null;

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }
  function nick(s) {
    return s.nickname || s.name.split(" ")[0];
  }
  // Cards get a short form of very long nicknames; the sheet always shows the full one.
  function shortNick(s) {
    var n = nick(s);
    if (n.length <= 22) return n;
    var cut = n.search(/[(,]/);
    if (cut > 2) return n.slice(0, cut).trim();
    var out = "";
    n.split(" ").some(function (w) {
      if ((out + " " + w).trim().length > 20) return true;
      out = (out + " " + w).trim();
      return false;
    });
    return out + "…";
  }

  /* --------------------------------------------------------------- the grid */

  function tilt(no) {
    return (((no * 37) % 7) - 3) * 0.7;
  }

  function buildCard(s) {
    var frame = YB.el("span", { class: "cast-card__frame" });
    var img = YB.photoImg(s.photo, { widths: [400, 800], sizes: "(min-width: 64rem) 200px, 46vw", alt: "" });
    if (img) frame.appendChild(img);
    else frame.classList.add("is-missing");
    // Accessible name comes from the visible text (nickname, name, number) — WCAG 2.5.3.
    var btn = YB.el("button", { class: "cast-card__btn", type: "button", "aria-haspopup": "dialog", "data-no": s.no }, [
      frame,
      YB.el("span", { class: "cast-card__nick", text: shortNick(s) }),
      YB.el("span", { class: "cast-card__name", text: s.name }),
      YB.el("span", { class: "cast-card__no", text: "No. " + pad(s.no) }),
    ]);
    var li = YB.el("li", { class: "cast-card", style: { "--tilt": tilt(s.no) + "deg" } }, [btn]);
    li.searchKey = YB.fold([s.name, s.nickname, s.hobby, "absen " + s.no].join(" "));
    return li;
  }

  function sorted() {
    var list = students.slice();
    if (order === "az") {
      list.sort(function (a, b) {
        return a.name.localeCompare(b.name, "id");
      });
    }
    return list;
  }

  function visibleNos() {
    return sorted()
      .filter(function (s) {
        return !cards[s.no].hidden;
      })
      .map(function (s) {
        return s.no;
      });
  }

  function applyFilter() {
    var q = YB.fold(query.trim());
    var shown = 0;
    sorted().forEach(function (s) {
      var li = cards[s.no];
      var match = !q || li.searchKey.indexOf(q) !== -1 || String(s.no) === q;
      li.hidden = !match;
      if (match) shown++;
      grid.appendChild(li);
    });
    countEl.textContent = q ? shown + " dari " + total + " pemeran" : total + " pemeran";
    emptyEl.hidden = shown !== 0;
  }

  students.forEach(function (s) {
    cards[s.no] = buildCard(s);
  });
  applyFilter();

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-no]");
    if (btn) openSheet(Number(btn.getAttribute("data-no")));
  });

  var timer = 0;
  input.addEventListener("input", function () {
    win.clearTimeout(timer);
    timer = win.setTimeout(function () {
      query = input.value;
      applyFilter();
    }, 80);
  });
  input.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    // Stop the same keystroke from activating the sheet's close button once focus moves there.
    e.preventDefault();
    query = input.value;
    applyFilter();
    var first = visibleNos()[0];
    if (first) {
      win.requestAnimationFrame(function () {
        openSheet(first);
      });
    }
  });

  doc.querySelectorAll("[data-sort]").forEach(function (b) {
    b.addEventListener("click", function () {
      order = b.getAttribute("data-sort");
      doc.querySelectorAll("[data-sort]").forEach(function (o) {
        o.setAttribute("aria-pressed", String(o === b));
      });
      applyFilter();
    });
  });

  // "Siapa hari ini?" — a short spotlight roulette, then open the chosen one.
  var rolling = false;
  var shuffleBtn = doc.querySelector("[data-shuffle]");
  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", function () {
      var nos = visibleNos();
      if (!nos.length || rolling) return;
      var pick = nos[Math.floor(Math.random() * nos.length)];
      if (!YB.motionOn()) {
        openSheet(pick);
        return;
      }
      rolling = true;
      var steps = 4;
      var spin = win.setInterval(function () {
        grid.querySelectorAll(".is-spotlight").forEach(function (n) {
          n.classList.remove("is-spotlight");
        });
        if (steps-- <= 0) {
          win.clearInterval(spin);
          var li = cards[pick];
          li.classList.add("is-spotlight");
          li.scrollIntoView({ block: "center", behavior: "smooth" });
          win.setTimeout(function () {
            li.classList.remove("is-spotlight");
            rolling = false;
            openSheet(pick);
          }, 520);
          return;
        }
        cards[nos[Math.floor(Math.random() * nos.length)]].classList.add("is-spotlight");
      }, 340);
    });
  }

  /* ------------------------------------------------------ character sheet */

  function fact(label, dd, extraClass) {
    return YB.el("div", { class: "sheet__fact" + (extraClass ? " " + extraClass : "") }, [YB.el("dt", { text: label }), dd]);
  }

  function ttl(s) {
    var v = vaultData && vaultData[s.no];
    if (v) {
      var date = v.d + " " + YB.MONTHS[v.m - 1] + " " + v.y;
      return YB.el("dd", { class: "is-declassified" }, [(v.pob ? v.pob + ", " : "") + date + " ", YB.el("span", { class: "stamp", text: "Declassified" })]);
    }
    return YB.el("dd", { class: "is-redacted" }, [
      YB.el("span", { class: "redact", "aria-hidden": "true" }),
      YB.el("span", { class: "sr-only", text: "Terkunci. " }),
      YB.el("button", { class: "linkish", type: "button", "data-vault-open": "" }, ["Buka arsip kelas"]),
    ]);
  }

  function renderSheet(s, focusRole) {
    var list = visibleNos();
    if (list.indexOf(s.no) === -1) list = sorted().map(function (x) {
      return x.no;
    });
    var i = list.indexOf(s.no);
    var prev = byNo[list[(i - 1 + list.length) % list.length]];
    var next = byNo[list[(i + 1) % list.length]];

    var frame = YB.el("div", { class: "sheet__frame" });
    var img = YB.photoImg(s.photo, { widths: [800, 1600], sizes: "(min-width: 48rem) 420px, 100vw", alt: "Foto " + nick(s), eager: true });
    if (img) frame.appendChild(img);
    else frame.classList.add("is-missing");

    var facts = [];
    if (s.message) facts.push(fact("Pesan", YB.el("dd", { class: "sheet__msg", text: s.message })));
    if (s.hobby) facts.push(fact("Hobi", YB.el("dd", { text: s.hobby })));
    if (s.birthday) facts.push(fact("Ulang tahun", YB.el("dd", { text: YB.formatDayMonth(s.birthday) })));
    facts.push(fact("Tempat, tanggal lahir", ttl(s), "sheet__fact--vault"));
    if (s.instagram.length) {
      facts.push(
        fact(
          "Instagram",
          YB.el(
            "dd",
            { class: "sheet__ig" },
            s.instagram.map(function (h) {
              return YB.el("a", { href: "https://www.instagram.com/" + encodeURIComponent(h) + "/", target: "_blank", rel: "noopener noreferrer", text: "@" + h });
            })
          )
        )
      );
    }

    var mystery = !s.quote && !s.message && !s.hobby;
    var closeBtn = YB.el("button", { class: "sheet__close", type: "button", "aria-label": "Tutup kartu", "data-sheet-close": "" }, [YB.el("span", { "aria-hidden": "true", text: "✕" })]);
    var prevBtn = YB.el("button", { class: "btn btn--ghost btn-sm", type: "button", "data-sheet-step": "-1", "aria-label": "Sebelumnya: " + nick(prev) }, ["← ", YB.el("span", { class: "sheet__stepname", text: nick(prev) })]);
    var nextBtn = YB.el("button", { class: "btn btn--ink btn-sm", type: "button", "data-sheet-step": "1", "aria-label": "Berikutnya: " + nick(next) }, [YB.el("span", { class: "sheet__stepname", text: nick(next) }), " →"]);

    sheet.replaceChildren(
      YB.el("div", { class: "sheet__inner" }, [
        closeBtn,
        YB.el("div", { class: "sheet__media" }, [frame, YB.el("p", { class: "sheet__no", text: "No. " + pad(s.no) + " / " + total })]),
        YB.el("div", { class: "sheet__body" }, [
          YB.el("p", { class: "kicker", text: "Kartu karakter" }),
          YB.el("h2", { class: "sheet__name", id: "sheet-name", text: s.name }),
          s.nickname ? YB.el("p", { class: "sheet__aka" }, [YB.el("span", { class: "sheet__aka-label", text: "a.k.a." }), YB.el("span", { class: "script" + (s.nickname.length > 28 ? " is-long" : ""), text: s.nickname })]) : null,
          s.quote ? YB.el("blockquote", { class: "sheet__quote", text: s.quote }) : null,
          mystery ? YB.el("p", { class: "sheet__mystery", text: "Tidak mengisi form. Misterius." }) : null,
          YB.el("dl", { class: "sheet__facts" }, facts),
        ]),
        YB.el("div", { class: "sheet__bar" }, [prevBtn, nextBtn]),
      ])
    );
    current = s.no;
    var target = focusRole === "-1" ? prevBtn : focusRole === "1" ? nextBtn : closeBtn;
    target.focus({ preventScroll: true });
  }

  function hashNo() {
    var m = win.location.hash.match(/^#no-(\d{1,2})$/);
    return m && byNo[Number(m[1])] ? Number(m[1]) : null;
  }

  function openSheet(no, fromHistory) {
    var s = byNo[no];
    if (!s) return;
    if (!sheet.open) {
      sheet.showModal();
      root.classList.add("sheet-open");
    }
    renderSheet(s);
    if (!fromHistory && hashNo() !== no) {
      win.history.pushState({ yb: no }, "", "#no-" + no);
      pushed = true;
    }
  }

  function step(dir) {
    var list = visibleNos();
    if (list.indexOf(current) === -1) list = sorted().map(function (x) {
      return x.no;
    });
    var i = list.indexOf(current);
    var no = list[(i + dir + list.length) % list.length];
    renderSheet(byNo[no], String(dir));
    win.history.replaceState({ yb: no }, "", "#no-" + no);
  }

  var closingFromHistory = false;
  function closeSheet(fromHistory) {
    if (!sheet.open) return;
    closingFromHistory = !!fromHistory;
    sheet.close();
  }

  sheet.addEventListener("close", function () {
    root.classList.remove("sheet-open");
    var no = current;
    current = null;
    if (!closingFromHistory) {
      if (pushed) win.history.back();
      else win.history.replaceState(null, "", win.location.pathname + win.location.search);
    }
    pushed = false;
    closingFromHistory = false;
    var card = no && cards[no];
    if (card && !card.hidden) card.querySelector("button").focus({ preventScroll: false });
  });

  sheet.addEventListener("click", function (e) {
    if (e.target === sheet) return closeSheet(); // click on the backdrop
    if (e.target.closest("[data-sheet-close]")) return closeSheet();
    var stepBtn = e.target.closest("[data-sheet-step]");
    if (stepBtn) step(Number(stepBtn.getAttribute("data-sheet-step")));
  });

  sheet.addEventListener("keydown", function (e) {
    if (e.target.matches("input, textarea")) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  });

  // Swipe left/right for the next person; swipe the photo down to close (bottom sheet).
  var touch = null;
  sheet.addEventListener(
    "touchstart",
    function (e) {
      if (e.touches.length !== 1) return;
      touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, onMedia: !!e.target.closest(".sheet__media") };
    },
    { passive: true }
  );
  sheet.addEventListener(
    "touchend",
    function (e) {
      if (!touch) return;
      var dx = e.changedTouches[0].clientX - touch.x;
      var dy = e.changedTouches[0].clientY - touch.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
      else if (touch.onMedia && dy > 90 && dy > Math.abs(dx) * 1.4) closeSheet();
      touch = null;
    },
    { passive: true }
  );

  win.addEventListener("popstate", function () {
    var no = hashNo();
    pushed = false;
    if (no) openSheet(no, true);
    else closeSheet(true);
  });

  /* ------------------------------------------------------------ the vault */

  var passInput = doc.getElementById("vault-pass");
  var statusEl = vaultDialog.querySelector("[data-vault-status]");
  var submitBtn = vaultDialog.querySelector("[data-vault-submit]");
  var showToggle = vaultDialog.querySelector("[data-vault-show]");
  var toolbarBtn = doc.querySelector("[data-vault-toggle]");
  var busy = false;

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = "vault__status" + (kind ? " is-" + kind : "");
  }

  function syncToolbar() {
    if (!toolbarBtn) return;
    toolbarBtn.querySelector("[data-vault-label]").textContent = vaultData ? "Kunci arsip" : "Arsip kelas";
    toolbarBtn.setAttribute("aria-pressed", String(!!vaultData));
    root.classList.toggle("vault-open", !!vaultData);
  }

  function openVault() {
    if (!(win.isSecureContext && win.crypto && win.crypto.subtle)) {
      setStatus("Arsip hanya bisa dibuka lewat koneksi aman (https://).", "error");
    } else if (!win.YB_VAULT || !win.YBVaultCore) {
      setStatus("Arsip tidak ditemukan.", "error");
    } else {
      setStatus("");
    }
    vaultDialog.showModal();
    passInput.focus();
  }

  function lockVault() {
    vaultData = null;
    syncToolbar();
    if (sheet.open && current) renderSheet(byNo[current]);
  }

  async function unlock() {
    if (busy) return;
    var pass = passInput.value;
    if (!pass.trim()) {
      setStatus("Masukkan kata sandi kelas dulu.", "error");
      return;
    }
    if (!(win.isSecureContext && win.crypto && win.crypto.subtle && win.YBVaultCore && win.YB_VAULT)) {
      setStatus("Arsip tidak bisa dibuka di sini (butuh https://).", "error");
      return;
    }
    busy = true;
    submitBtn.disabled = true;
    vaultDialog.classList.add("is-busy");
    setStatus("Mencuci film… (beberapa detik di HP lama)");
    try {
      vaultData = await win.YBVaultCore.open(win.YB_VAULT, pass);
      passInput.value = "";
      setStatus("");
      vaultDialog.close();
      syncToolbar();
      if (sheet.open && current) renderSheet(byNo[current]);
      // With a sheet open the declassify animation is the feedback; the toast would sit behind the dialog.
      if (!sheet.open) YB.toast("Arsip kelas terbuka. Tanggal & tempat lahir sekarang terlihat.");
    } catch (err) {
      setStatus(err && err.code === "BAD_PASSPHRASE" ? "Kata sandi salah. Tanya grup kelas kalau lupa." : "Arsip tidak bisa dibuka di browser ini.", "error");
      vaultDialog.classList.remove("is-shake");
      void vaultDialog.offsetWidth; // restart the shake animation
      vaultDialog.classList.add("is-shake");
      passInput.select();
    } finally {
      busy = false;
      submitBtn.disabled = false;
      vaultDialog.classList.remove("is-busy");
    }
  }

  doc.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-vault-open]");
    if (opener) {
      e.preventDefault();
      openVault();
      return;
    }
    var toggle = e.target.closest("[data-vault-toggle]");
    if (toggle) {
      if (vaultData) lockVault();
      else openVault();
    }
  });
  submitBtn.addEventListener("click", unlock);
  passInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      unlock();
    }
  });
  vaultDialog.querySelector("[data-vault-cancel]").addEventListener("click", function () {
    vaultDialog.close();
  });
  showToggle.addEventListener("change", function () {
    passInput.type = showToggle.checked ? "text" : "password";
  });
  vaultDialog.addEventListener("close", function () {
    passInput.value = "";
    showToggle.checked = false;
    passInput.type = "password";
  });
  syncToolbar();

  /* ------------------------------------------------------------ deep link */

  var initial = hashNo();
  if (initial) {
    openSheet(initial, true);
  }
})();
