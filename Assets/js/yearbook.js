/*
  RPL XII-2 — shared helpers + global behaviour (nav, motion toggle, reveals)
  and the home page (intro, timecode, marquee, video facade, end credits).

  Rules this file follows:
    - Data is rendered with textContent only (YB.el) — never innerHTML.
    - Everything that moves checks YB.motionOn() and stops when motion is off,
      when it is off-screen, or when the tab is hidden.
*/
(function () {
  "use strict";

  var doc = document;
  var win = window;
  var root = doc.documentElement;
  var YB = (win.YB = win.YB || {});

  /* ------------------------------------------------------------------ helpers */

  function safeUrl(u) {
    var s = String(u);
    return /^(https:\/\/|#|[\w./-]+(\?|#|$))/i.test(s) && !/^\s*javascript:/i.test(s) ? s : "#";
  }

  // Tiny DOM builder. Strings become text nodes; "text" sets textContent.
  YB.el = function (tag, props, children) {
    var node = doc.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "text") node.textContent = v;
        else if (k === "class") node.className = v;
        else if (k === "on") {
          Object.keys(v).forEach(function (ev) {
            node.addEventListener(ev, v[ev]);
          });
        } else if (k === "style") {
          Object.keys(v).forEach(function (p) {
            node.style.setProperty(p, v[p]);
          });
        } else if (k === "href" || k === "src") node.setAttribute(k, safeUrl(v));
        else node.setAttribute(k, v === true ? "" : String(v));
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === "string" ? doc.createTextNode(c) : c);
    });
    return node;
  };

  YB.MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  YB.formatDayMonth = function (b) {
    return b ? b.d + " " + YB.MONTHS[b.m - 1] : null;
  };

  YB.store = {
    get: function (key, area) {
      try {
        return win[area || "localStorage"].getItem(key);
      } catch (e) {
        return null;
      }
    },
    set: function (key, value, area) {
      try {
        win[area || "localStorage"].setItem(key, value);
      } catch (e) {
        /* storage blocked — the page still works */
      }
    },
  };

  YB.motionOn = function () {
    return !root.classList.contains("motion-off");
  };

  // Accent- and case-insensitive search key; also folds small caps like "ɴᴇᴋᴏᴍᴀ".
  var SMALL_CAPS = { ᴀ: "a", ʙ: "b", ᴄ: "c", ᴅ: "d", ᴇ: "e", ꜰ: "f", ɢ: "g", ʜ: "h", ɪ: "i", ᴊ: "j", ᴋ: "k", ʟ: "l", ᴍ: "m", ɴ: "n", ᴏ: "o", ᴘ: "p", ǫ: "q", ʀ: "r", ꜱ: "s", ᴛ: "t", ᴜ: "u", ᴠ: "v", ᴡ: "w", ʏ: "y", ᴢ: "z" };
  YB.fold = function (s) {
    return String(s || "")
      .replace(/[ɐ-ʯᴀ-ᵿꜰ-ꟿ]/g, function (ch) {
        return SMALL_CAPS[ch] || ch;
      })
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
  };

  // Photos: { drive: id } (Google Drive thumbnail) or { src: "Assets/images/cast/no-1" } (self-hosted).
  YB.drive = function (id, w) {
    return "https://drive.google.com/thumbnail?id=" + encodeURIComponent(id) + "&sz=w" + w;
  };
  YB.photoSources = function (photo, widths) {
    if (!photo) return null;
    var list = widths || [400, 800, 1600];
    var url = photo.drive
      ? function (w) {
          return YB.drive(photo.drive, w);
        }
      : function (w) {
          return photo.src + "-" + w + ".webp";
        };
    return {
      src: url(list[Math.min(1, list.length - 1)]),
      srcset: list
        .map(function (w) {
          return url(w) + " " + w + "w";
        })
        .join(", "),
    };
  };

  // <img> for a data photo; on error the parent frame shows the "no photo" slate.
  YB.photoImg = function (photo, opts) {
    var o = opts || {};
    var s = YB.photoSources(photo, o.widths);
    if (!s) return null;
    var img = YB.el("img", {
      src: s.src,
      srcset: s.srcset,
      sizes: o.sizes || "100vw",
      alt: o.alt || "",
      width: o.width || null,
      height: o.height || null,
      loading: o.eager ? null : "lazy",
      decoding: "async",
      referrerpolicy: "no-referrer",
      draggable: "false",
    });
    img.addEventListener("error", function () {
      var frame = img.parentNode;
      if (frame && frame.classList) frame.classList.add("is-missing");
      img.remove();
    });
    return img;
  };

  YB.onVisible = function (el, cb, margin) {
    if (!el) return;
    if (!("IntersectionObserver" in win)) {
      cb(true);
      return;
    }
    new IntersectionObserver(
      function (entries) {
        cb(entries[entries.length - 1].isIntersecting);
      },
      { rootMargin: margin || "0px" }
    ).observe(el);
  };

  YB.students = function () {
    return (win.YB_STUDENTS || []).slice().sort(function (a, b) {
      return a.no - b.no;
    });
  };

  /* ------------------------------------------------------------ global parts */

  function initNav() {
    var nav = doc.querySelector("[data-nav]");
    if (!nav) return;
    var ticking = false;
    function update() {
      nav.classList.toggle("is-scrolled", win.scrollY > 24);
      ticking = false;
    }
    win.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          win.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();

    var btn = nav.querySelector("[data-menu-button]");
    var menu = doc.getElementById("menu");
    if (!btn || !menu) return;
    var label = btn.querySelector(".sr-only");
    function setOpen(open) {
      btn.setAttribute("aria-expanded", String(open));
      if (label) label.textContent = open ? "Tutup menu" : "Buka menu";
      menu.hidden = !open;
      root.classList.toggle("menu-open", open);
      doc.querySelectorAll("main, footer, .skip-link").forEach(function (n) {
        n.inert = open;
      });
      if (open) {
        var first = menu.querySelector("a");
        if (first) first.focus();
      }
    }
    btn.addEventListener("click", function () {
      setOpen(btn.getAttribute("aria-expanded") !== "true");
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) {
        setOpen(false);
        btn.focus();
      }
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    if (win.matchMedia) {
      var wide = win.matchMedia("(min-width: 48rem)");
      var onWide = function (e) {
        if (e.matches && !menu.hidden) setOpen(false);
      };
      if (wide.addEventListener) wide.addEventListener("change", onWide);
    }
  }

  function initMotionToggle() {
    var toggles = doc.querySelectorAll("[data-motion-toggle]");
    function sync() {
      var on = YB.motionOn();
      toggles.forEach(function (t) {
        t.setAttribute("aria-pressed", String(on));
        t.title = on ? "Matikan animasi" : "Nyalakan animasi";
        var state = t.querySelector(".motion-toggle__state");
        if (state) state.textContent = on ? "On" : "Off";
      });
    }
    toggles.forEach(function (t) {
      t.addEventListener("click", function () {
        var on = !YB.motionOn();
        root.classList.toggle("motion-off", !on);
        YB.store.set("yb-motion", on ? "on" : "off");
        sync();
        doc.dispatchEvent(new CustomEvent("yb:motion", { detail: { on: on } }));
      });
    });
    sync();
  }

  function initReveals() {
    var els = doc.querySelectorAll(".reveal");
    if (!els.length || !("IntersectionObserver" in win)) return;
    root.classList.add("reveal-ready");
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );
    els.forEach(function (el) {
      io.observe(el);
    });
  }

  /* --------------------------------------------------------------- home page */

  function initLeader() {
    if (!root.classList.contains("intro-play")) return;
    YB.store.set("yb-intro", "1", "sessionStorage");
    var leader = doc.querySelector(".leader");
    var events = ["pointerdown", "keydown", "wheel", "touchstart"];
    function finish() {
      root.classList.remove("intro-play");
      events.forEach(function (ev) {
        win.removeEventListener(ev, skip);
      });
    }
    function skip() {
      if (!leader || leader.classList.contains("is-done")) return;
      leader.classList.add("is-done");
      win.setTimeout(finish, 350);
    }
    events.forEach(function (ev) {
      win.addEventListener(ev, skip, { passive: true });
    });
    // The CSS countdown ends by itself; drop the class once the hero entrance has played.
    win.setTimeout(finish, 4200);
  }

  function initTimecode() {
    var tc = doc.querySelector("[data-timecode]");
    if (!tc) return;
    var start = win.performance.now();
    var raf = 0;
    var visible = true;
    var last = "";
    function pad(n) {
      return (n < 10 ? "0" : "") + n;
    }
    function frame(now) {
      var t = (now - start) / 1000;
      var text = pad(Math.floor(t / 3600)) + ":" + pad(Math.floor(t / 60) % 60) + ":" + pad(Math.floor(t) % 60) + ":" + pad(Math.floor((t % 1) * 25));
      if (text !== last) tc.textContent = last = text;
      raf = win.requestAnimationFrame(frame);
    }
    function run() {
      win.cancelAnimationFrame(raf);
      if (visible && YB.motionOn() && !doc.hidden) raf = win.requestAnimationFrame(frame);
    }
    YB.onVisible(tc.closest("section") || tc, function (v) {
      visible = v;
      run();
    });
    doc.addEventListener("yb:motion", run);
    doc.addEventListener("visibilitychange", run);
  }

  function initMarquee() {
    var box = doc.querySelector("[data-marquee]");
    var list = YB.students();
    if (!box || !list.length) return;
    var names = list.map(function (s) {
      return s.nickname || s.name.split(" ")[0];
    });
    var tracks = box.querySelectorAll("[data-marquee-track]");
    tracks.forEach(function (track, i) {
      var seq = i ? names.slice().reverse() : names;
      [false, true].forEach(function (dup) {
        seq.forEach(function (n) {
          track.appendChild(YB.el("span", { class: "marquee__item", text: n, "data-dup": dup ? "" : null }));
        });
      });
    });
    function timing() {
      tracks.forEach(function (track, i) {
        var px = track.scrollWidth / 2;
        track.style.setProperty("--dur", Math.max(20, Math.round(px / (i ? 52 : 70))) + "s");
      });
    }
    timing();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(timing);
    YB.onVisible(box, function (v) {
      box.classList.toggle("is-paused", !v);
    });
  }

  function initFacade() {
    doc.querySelectorAll("[data-video]").forEach(function (box) {
      var btn = box.querySelector(".facade__play");
      if (!btn) return;
      btn.addEventListener("click", function () {
        var frame = YB.el("iframe", {
          src: "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(box.getAttribute("data-video")) + "?autoplay=1&rel=0&playsinline=1",
          title: box.getAttribute("data-title") || "Video YouTube",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
          allowfullscreen: true,
          // YouTube refuses to play embeds that send no referrer (error 153).
          referrerpolicy: "strict-origin-when-cross-origin",
        });
        btn.replaceWith(frame);
        frame.focus();
      });
    });
  }

  function initCredits() {
    var cast = doc.querySelector("[data-credits-cast]");
    YB.students().forEach(function (s) {
      if (!cast) return;
      cast.appendChild(
        YB.el("li", null, [
          YB.el("span", { class: "credits__name", text: s.name }),
          YB.el("span", { class: "credits__as" }, [YB.el("i", { text: "sebagai" }), " ", YB.el("b", { text: s.nickname || "dirinya sendiri" })]),
        ])
      );
    });

    var vp = doc.querySelector("[data-credits]");
    if (!vp) return;
    var btn = doc.querySelector("[data-credits-toggle]");
    var SPEED = 36; // px per second
    var paused = false;
    var visible = false;
    var hover = false;
    var focus = false;
    var holdUntil = 0;
    var pos = 0;
    var last = 0;
    var raf = 0;

    function loop(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!hover && !focus && now > holdUntil) {
        var max = vp.scrollHeight - vp.clientHeight;
        pos += SPEED * dt;
        if (pos >= max) {
          pos = 0;
          holdUntil = now + 1800;
        }
        vp.scrollTop = pos;
      }
      raf = win.requestAnimationFrame(loop);
    }
    function sync() {
      win.cancelAnimationFrame(raf);
      var motion = YB.motionOn();
      if (btn) {
        btn.hidden = !motion;
        btn.textContent = paused ? "▶ Putar kredit" : "❚❚ Jeda kredit";
      }
      if (visible && !paused && motion && !doc.hidden) {
        pos = vp.scrollTop;
        last = win.performance.now();
        raf = win.requestAnimationFrame(loop);
      }
    }
    // Let people read or scroll it themselves; resume a few seconds later.
    function hold() {
      holdUntil = win.performance.now() + 4000;
      pos = vp.scrollTop;
    }
    ["wheel", "touchstart", "pointerdown", "keydown"].forEach(function (ev) {
      vp.addEventListener(ev, hold, { passive: true });
    });
    vp.addEventListener(
      "scroll",
      function () {
        if (Math.abs(vp.scrollTop - pos) > 2) hold();
      },
      { passive: true }
    );
    vp.addEventListener("mouseenter", function () {
      hover = true;
    });
    vp.addEventListener("mouseleave", function () {
      hover = false;
    });
    vp.addEventListener("focusin", function () {
      focus = true;
    });
    vp.addEventListener("focusout", function () {
      focus = false;
    });
    if (btn) {
      btn.addEventListener("click", function () {
        paused = !paused;
        sync();
      });
    }
    YB.onVisible(vp, function (v) {
      visible = v;
      sync();
    });
    doc.addEventListener("yb:motion", sync);
    doc.addEventListener("visibilitychange", sync);
    sync();
  }

  function initPostcredit() {
    var box = doc.querySelector("[data-postcredit]");
    // Short messages only — a post-credit scene is a single line, not a letter.
    var pool = YB.students().filter(function (s) {
      return s.message && s.message.length <= 140;
    });
    if (!box || !pool.length) return;
    var quote = box.querySelector(".postcredit__quote");
    var who = box.querySelector(".postcredit__who");
    var next = box.querySelector("[data-postcredit-next]");
    var lastNo = null;
    function pick() {
      var s;
      do {
        s = pool[Math.floor(Math.random() * pool.length)];
      } while (pool.length > 1 && s.no === lastNo);
      lastNo = s.no;
      quote.textContent = s.message;
      who.replaceChildren("— ", YB.el("a", { href: "profile.html#no-" + s.no, text: s.nickname || s.name }), ", absen " + s.no);
    }
    if (next) {
      next.hidden = false;
      next.addEventListener("click", pick);
    }
    pick();
  }

  /* -------------------------------------------------------------------- boot */

  initNav();
  initMotionToggle();
  if (doc.body.getAttribute("data-page") === "home") {
    initLeader();
    initTimecode();
    initMarquee();
    initFacade();
    initCredits();
    initPostcredit();
  }
  initReveals();
})();
