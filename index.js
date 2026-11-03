// index.js: Dane Beels personal site
// Vanilla JS only. Each feature is a small init function; all fail soft.

(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* storage unavailable */ } },
  };

  /* ------------------------------------------------------------------ */
  /* Footer year                                                         */
  /* ------------------------------------------------------------------ */
  function initYear() {
    const yearEl = $("#year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------------------------ */
  /* Theme toggle                                                        */
  /* ------------------------------------------------------------------ */
  const themeListeners = [];
  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    store.set("theme", theme);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#dff2f5" : "#0B1A33");
    themeListeners.forEach((fn) => fn(theme));
  }
  function toggleTheme() {
    setTheme(root.getAttribute("data-theme") === "light" ? "dark" : "light");
  }
  function initTheme() {
    const btn = $("#theme-toggle");
    if (btn) btn.addEventListener("click", toggleTheme);
  }

  /* ------------------------------------------------------------------ */
  /* Toast                                                               */
  /* ------------------------------------------------------------------ */
  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 1800);
  }

  /* ------------------------------------------------------------------ */
  /* Nav: mobile menu, scrolled state, scroll-spy                        */
  /* ------------------------------------------------------------------ */
  function initNav() {
    const header = $(".site-header");
    const toggle = $(".nav__toggle");
    const menu = $("#nav-menu");

    if (toggle && menu) {
      const close = () => {
        toggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("is-open");
      };
      toggle.addEventListener("click", () => {
        const open = toggle.getAttribute("aria-expanded") !== "true";
        toggle.setAttribute("aria-expanded", String(open));
        menu.classList.toggle("is-open", open);
      });
      $$("a, [data-open-terminal]", menu).forEach((el) => el.addEventListener("click", close));
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    }

    if (header) {
      const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    // Scroll-spy
    const links = $$(".nav__links a");
    const sections = links
      .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
      .filter(Boolean);
    if (!("IntersectionObserver" in window) || !sections.length) return;

    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((a) =>
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id)
          );
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ------------------------------------------------------------------ */
  /* Reveal on scroll                                                    */
  /* ------------------------------------------------------------------ */
  function initReveal() {
    const items = $$(".reveal");
    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------ */
  /* Copy-to-clipboard                                                   */
  /* ------------------------------------------------------------------ */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fallback for older browsers / insecure contexts
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  }
  function initCopy() {
    $$("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const ok = await copyText(btn.dataset.copy);
        toast(ok ? "Copied " + btn.dataset.copy : "Copy failed. Select it manually.");
        if (ok) {
          btn.textContent = "Copied";
          setTimeout(() => (btn.textContent = "Copy"), 1500);
        }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Photo lightbox                                                      */
  /* ------------------------------------------------------------------ */
  function initLightbox() {
    const dialog = $("#lightbox");
    const img = $("#lightbox-img");
    const caption = $("#lightbox-caption");
    const items = $$(".gallery__item");
    if (!dialog || !img || !items.length || typeof dialog.showModal !== "function") return;

    let index = 0;
    const show = (i) => {
      index = (i + items.length) % items.length;
      const a = items[index];
      const thumb = $("img", a);
      img.src = a.getAttribute("href");
      img.alt = thumb ? thumb.alt : "";
      caption.textContent = a.dataset.caption || "";
    };

    items.forEach((a, i) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        show(i);
        dialog.showModal();
      });
    });

    dialog.addEventListener("click", (e) => {
      const action = e.target.closest("[data-lightbox]");
      if (action) {
        const kind = action.dataset.lightbox;
        if (kind === "close") dialog.close();
        else show(index + (kind === "next" ? 1 : -1));
        return;
      }
      if (e.target === dialog || e.target.classList.contains("lightbox__figure")) dialog.close();
    });

    dialog.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") show(index + 1);
      else if (e.key === "ArrowLeft") show(index - 1);
    });

    dialog.addEventListener("close", () => { img.removeAttribute("src"); });
  }

  /* ------------------------------------------------------------------ */
  /* Background: drifting point cloud with Vietoris–Rips-style edges     */
  /* (a nod to topological data analysis)                                */
  /* ------------------------------------------------------------------ */
  function initBackground() {
    const canvas = $("#bg-canvas");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");

    let w = 0, h = 0, dpr = 1;
    let points = [];
    let nodeRGB = "176, 224, 230";
    let edgeRGB = "34, 211, 238";
    let running = true;
    let rafId = null;
    const RADIUS = 140;

    const readColors = () => {
      const cs = getComputedStyle(root);
      nodeRGB = cs.getPropertyValue("--node").trim() || nodeRGB;
      edgeRGB = cs.getPropertyValue("--edge").trim() || edgeRGB;
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let a = 0; a < points.length; a++) {
        const p = points[a];
        for (let b = a + 1; b < points.length; b++) {
          const q = points[b];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < RADIUS * RADIUS) {
            ctx.strokeStyle = `rgba(${edgeRGB}, ${(1 - Math.sqrt(d2) / RADIUS) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = `rgba(${nodeRGB}, 0.4)`;
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.max(20, Math.min(60, Math.round((w * h) / 26000)));
      while (points.length < target) {
        points.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          r: 1 + Math.random() * 1.2,
        });
      }
      points.length = target;
      points.forEach((p) => { p.x = Math.min(p.x, w); p.y = Math.min(p.y, h); });
      if (reducedMotion) draw();
    };

    const step = () => {
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      draw();
      if (running) rafId = requestAnimationFrame(step);
    };

    readColors();
    resize();
    themeListeners.push(() => { readColors(); if (reducedMotion) draw(); });

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    });

    if (reducedMotion) { draw(); return; }

    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
      if (running && !rafId) rafId = requestAnimationFrame(step);
      if (!running && rafId) { cancelAnimationFrame(rafId); rafId = null; }
    });

    rafId = requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------------ */
  /* Interactive terminal                                                */
  /* ------------------------------------------------------------------ */
  function initTerminal() {
    const dialog = $("#shell");
    const out = $("#shell-output");
    const form = $("#shell-form");
    const input = $("#shell-input");
    if (!dialog || !out || !form || !input || typeof dialog.showModal !== "function") {
      $$("[data-open-terminal]").forEach((b) => (b.hidden = true));
      return;
    }

    const history = [];
    let hIdx = 0;

    const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const print = (html, cls = "") => {
      const p = document.createElement("p");
      if (cls) p.className = cls;
      p.innerHTML = html;
      out.appendChild(p);
    };
    const scrollDown = () => { const body = $(".shell__body", dialog); body.scrollTop = body.scrollHeight; };

    const projects = $$(".card").map((c) => ({
      title: $(".card__title", c).textContent.trim(),
      type: $(".badge", c).textContent.trim(),
      href: $(".card__link", c).getAttribute("href"),
    }));
    const photos = $$(".gallery__item").map((a) => ({
      caption: a.dataset.caption || "",
      href: a.getAttribute("href"),
    }));
    const SECTIONS = ["about", "projects", "photos", "contact"];

    const go = (hash) => { dialog.close(); location.hash = hash; };

    const commands = {
      help: {
        desc: "list available commands",
        run: () => {
          Object.entries(commands).forEach(([name, c]) => {
            if (!c.hidden) print(`<span class="t-prompt">${name.padEnd(10)}</span><span class="t-dim">${c.desc}</span>`);
          });
        },
      },
      whoami: {
        desc: "who is this guy?",
        run: () => print("Christian Dane Beels: West Point cadet (c/o 2028), B.S. Mathematical Sciences.\nResearch: topological data analysis and network defense."),
      },
      projects: {
        desc: "list projects",
        run: () => projects.forEach((p, i) =>
          print(`[${i + 1}] <a href="${esc(p.href)}" target="_blank" rel="noopener">${esc(p.title)}</a> <span class="t-dim">(${esc(p.type)})</span>`)),
      },
      open: {
        desc: "open <n>: open project n",
        run: (args) => {
          const n = parseInt(args[0], 10);
          const p = projects[n - 1];
          if (!p) return print("usage: open &lt;1-" + projects.length + "&gt;", "t-err");
          window.open(p.href, "_blank", "noopener");
          print("opening " + esc(p.title) + " …", "t-dim");
        },
      },
      photos: {
        desc: "list photos",
        run: () => photos.forEach((p) =>
          print(`<a href="${esc(p.href)}" target="_blank" rel="noopener">${esc(p.caption)}</a>`)),
      },
      cv: {
        desc: "open my CV (PDF)",
        run: () => { window.open("pdfs/beels_cv.pdf", "_blank", "noopener"); print("opening beels_cv.pdf …", "t-dim"); },
      },
      github: {
        desc: "open my GitHub",
        run: () => { window.open("https://github.com/cdaneb", "_blank", "noopener"); print('→ <a href="https://github.com/cdaneb" target="_blank" rel="noopener">github.com/cdaneb</a>'); },
      },
      contact: {
        desc: "how to reach me",
        run: () => {
          print('west point  <a href="mailto:christian.beels@westpoint.edu">christian.beels@westpoint.edu</a>');
          print('personal    <a href="mailto:cdanebeels@gmail.com">cdanebeels@gmail.com</a>');
          print('orcid       <a href="https://orcid.org/0009-0001-8528-115X" target="_blank" rel="noopener">0009-0001-8528-115X</a>');
        },
      },
      ls: {
        desc: "list sections",
        run: () => print('<span class="t-prompt">' + SECTIONS.map((s) => s + "/").join("  ") + "  beels_cv.pdf</span>"),
      },
      cd: {
        desc: "cd <section>: jump to a section",
        run: (args) => {
          const t = (args[0] || "").replace(/^[~./]+/, "").replace(/\/$/, "");
          if (SECTIONS.includes(t)) return go(t);
          if (!t) return go("top");
          print("cd: no such directory: " + esc(args[0]), "t-err");
        },
      },
      theme: {
        desc: "toggle light/dark theme",
        run: () => { toggleTheme(); print("theme → " + root.getAttribute("data-theme"), "t-dim"); },
      },
      clear: { desc: "clear the screen", run: () => { out.innerHTML = ""; } },
      exit: { desc: "close the terminal", run: () => dialog.close() },
      sudo: { hidden: true, desc: "", run: () => print("guest is not in the sudoers file. This incident will be reported.", "t-err") },
      hello: { hidden: true, desc: "", run: () => print("General Kenobi. (C3T-HELO-4413)") },
    };

    const run = (line) => {
      const trimmed = line.trim();
      print(`<span class="t-prompt">guest@westpoint:~$</span>${esc(trimmed)}`);
      if (!trimmed) return;
      history.push(trimmed);
      hIdx = history.length;
      const [cmd, ...args] = trimmed.split(/\s+/);
      const c = commands[cmd.toLowerCase()];
      if (c) c.run(args);
      else print(`command not found: ${esc(cmd)}. Try <span class="t-prompt">help</span>`, "t-err");
    };

    const open = () => {
      if (dialog.open) return;
      dialog.showModal();
      if (!out.childElementCount) {
        print('Welcome! Type <span class="t-prompt">help</span> to see what you can do. Press Esc to close.', "t-dim");
      }
      input.focus();
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      run(input.value);
      input.value = "";
      scrollDown();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" && history.length) {
        e.preventDefault();
        hIdx = Math.max(0, hIdx - 1);
        input.value = history[hIdx];
      } else if (e.key === "ArrowDown" && history.length) {
        e.preventDefault();
        hIdx = Math.min(history.length, hIdx + 1);
        input.value = history[hIdx] || "";
      } else if (e.key === "Tab") {
        e.preventDefault();
        const partial = input.value.trim().toLowerCase();
        if (!partial) return;
        const matches = Object.keys(commands).filter((k) => !commands[k].hidden && k.startsWith(partial));
        if (matches.length === 1) input.value = matches[0] + " ";
        else if (matches.length > 1) { print(matches.join("  "), "t-dim"); scrollDown(); }
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        out.innerHTML = "";
      } else if (e.key === "`") {
        e.preventDefault();
        dialog.close();
      }
    });

    $$("[data-open-terminal]").forEach((b) => b.addEventListener("click", open));
    $$("[data-close-terminal]").forEach((b) => b.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
    $(".shell__body", dialog).addEventListener("click", () => input.focus());

    document.addEventListener("keydown", (e) => {
      if (e.key !== "`" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (["input", "textarea", "select"].includes(tag) || e.target.isContentEditable) return;
      const lightbox = $("#lightbox");
      if (lightbox && lightbox.open) return;
      e.preventDefault();
      open();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Console easter egg                                                  */
  /* ------------------------------------------------------------------ */
  function initConsole() {
    console.log("%cHello there!", "color:#22d3ee;font-weight:bold;font-size:14px");
    console.log("C3T-HELO-4413");
  }

  /* ------------------------------------------------------------------ */
  const boot = () => {
    [initYear, initTheme, initNav, initReveal, initCopy, initLightbox,
     initBackground, initTerminal, initConsole]
      .forEach((fn) => { try { fn(); } catch (err) { console.error(fn.name, err); } });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
