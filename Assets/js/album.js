/*
  Behind the Scenes (album.html): a contact sheet of film frames + a lightbox with
  keyboard, swipe, counter and deep links (#f-7).
*/
(function () {
  "use strict";

  var doc = document;
  var win = window;
  var YB = win.YB;
  if (!YB || doc.body.getAttribute("data-page") !== "album") return;

  var root = doc.documentElement;
  var photos = win.YB_ALBUM || [];
  var total = photos.length;
  var list = doc.querySelector("[data-frames]");
  var box = doc.querySelector("[data-lightbox]");
  var stage = box.querySelector("[data-lightbox-stage]");
  var countEl = box.querySelector("[data-lightbox-count]");
  var captionEl = box.querySelector("[data-lightbox-caption]");
  var current = -1;
  var pushed = false;
  var closingFromHistory = false;

  function num(i) {
    return (i < 9 ? "0" : "") + (i + 1);
  }
  function alt(i) {
    return photos[i].caption || "Foto kenangan RPL XII-2, frame " + (i + 1);
  }

  /* ----------------------------------------------------------- contact sheet */

  doc.querySelectorAll("[data-frame-total]").forEach(function (n) {
    n.textContent = String(total);
  });

  photos.forEach(function (p, i) {
    var img = YB.photoImg(p, { widths: [400, 800], sizes: "(min-width: 72rem) 300px, (min-width: 40rem) 45vw, 92vw", alt: alt(i) });
    var frame = YB.el("span", { class: "frame__img" }, [img]);
    if (!img) frame.classList.add("is-missing");
    var pick = (i * 7) % 10 === 3; // the photographer's grease-pencil picks
    var btn = YB.el("button", { class: "frame" + (pick ? " is-pick" : ""), type: "button", "data-i": i, "aria-label": "Buka foto " + (i + 1) + " dari " + total }, [
      frame,
      pick ? YB.el("span", { class: "frame__pick", "aria-hidden": "true", text: "favorit" }) : null,
      YB.el("span", { class: "frame__edge", "aria-hidden": "true" }, [YB.el("span", { text: "RPL XII-2 · 400" }), YB.el("span", { text: "▸ " + num(i) + "A" })]),
    ]);
    list.appendChild(YB.el("li", null, [btn]));
  });

  list.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-i]");
    if (btn) open(Number(btn.getAttribute("data-i")));
  });

  /* ---------------------------------------------------------------- lightbox */

  function show(i) {
    current = (i + total) % total;
    var p = photos[current];
    stage.classList.remove("is-missing");
    stage.classList.add("is-loading");
    var img = YB.photoImg(p, { widths: [800, 1600], sizes: "100vw", alt: alt(current), eager: true });
    if (img) {
      img.addEventListener("load", function () {
        stage.classList.remove("is-loading");
      });
      img.addEventListener("error", function () {
        stage.classList.remove("is-loading");
        stage.replaceChildren(YB.el("p", { class: "lightbox__missing", text: "Foto ini tidak bisa dimuat." }));
      });
      stage.replaceChildren(img);
    } else {
      stage.classList.remove("is-loading");
      stage.replaceChildren(YB.el("p", { class: "lightbox__missing", text: "Foto ini tidak tersedia." }));
    }
    countEl.textContent = num(current) + " / " + total;
    captionEl.textContent = p.caption || "";
    captionEl.hidden = !p.caption;
    // warm up the next frame
    var next = photos[(current + 1) % total];
    var s = YB.photoSources(next, [800]);
    if (s) {
      var pre = new Image();
      pre.referrerPolicy = "no-referrer";
      pre.src = s.src;
    }
  }

  function hashIndex() {
    var m = win.location.hash.match(/^#f-(\d{1,3})$/);
    var i = m ? Number(m[1]) - 1 : -1;
    return i >= 0 && i < total ? i : -1;
  }

  function open(i, fromHistory) {
    if (!box.open) {
      box.showModal();
      root.classList.add("lightbox-open");
    }
    show(i);
    if (!fromHistory && hashIndex() !== current) {
      win.history.pushState({ f: current }, "", "#f-" + (current + 1));
      pushed = true;
    }
  }

  function step(dir) {
    show(current + dir);
    win.history.replaceState({ f: current }, "", "#f-" + (current + 1));
  }

  function close(fromHistory) {
    if (!box.open) return;
    closingFromHistory = !!fromHistory;
    box.close();
  }

  box.addEventListener("close", function () {
    root.classList.remove("lightbox-open");
    var i = current;
    current = -1;
    stage.replaceChildren();
    if (!closingFromHistory) {
      if (pushed) win.history.back();
      else win.history.replaceState(null, "", win.location.pathname + win.location.search);
    }
    pushed = false;
    closingFromHistory = false;
    var btn = list.querySelector('[data-i="' + i + '"]');
    if (btn) btn.focus();
  });

  box.addEventListener("click", function (e) {
    if (e.target.closest("[data-lightbox-close]")) return close();
    var stepBtn = e.target.closest("[data-lightbox-step]");
    if (stepBtn) return step(Number(stepBtn.getAttribute("data-lightbox-step")));
    // a click on the dark area (not the photo or a control) closes, like most lightboxes
    if (e.target === box || e.target === stage) close();
  });

  box.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  });

  var touch = null;
  box.addEventListener(
    "touchstart",
    function (e) {
      if (e.touches.length === 1) touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      else touch = null; // pinch-zoom: leave it alone
    },
    { passive: true }
  );
  box.addEventListener(
    "touchend",
    function (e) {
      if (!touch) return;
      var dx = e.changedTouches[0].clientX - touch.x;
      var dy = e.changedTouches[0].clientY - touch.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
      else if (dy > 110 && dy > Math.abs(dx) * 1.4) close();
      touch = null;
    },
    { passive: true }
  );

  win.addEventListener("popstate", function () {
    var i = hashIndex();
    pushed = false;
    if (i >= 0) open(i, true);
    else close(true);
  });

  var initial = hashIndex();
  if (initial >= 0) open(initial, true);
})();
