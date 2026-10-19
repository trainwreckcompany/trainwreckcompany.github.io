// boot sequence
(() => {
  window.__bootReady = true;
  const root = document.documentElement;
  const boot = document.getElementById("boot");
  if (!boot || !root.classList.contains("booting")) return;

  // --- timeline (ms from the moment the sound starts) ------------------
  const HIT       = 1700;  // disk seats on the big hit in the sound
  const CRT_ON    = 350;   // power-on line
  const RUN       = 1150;  // rain
  const DRAIN     = 100;   // rain stopped, trails die off
  const ZOOM_AT   = 3450;  // second hit: push in through the glass
  const ZOOM      = 750;
  const OUT       = 350;   // final fade to the site
  const GLITCH_AT = 5150;  // third hit: title glitch on the site
  const GHOST     = 0.03;  // afterglow strength (0 = off, ~0.1 = obvious)
  const VOLUME    = 0.7;
  // ----------------------------------------------------------------------

  // calibration tables
  const GLYPH = ["fa2f8089c82078", "2228008a282080", "2228008a282080", "23ef00abe82070", "222800aa282008", "222800aa282008", "222f80522fbef0", "0", "f3e8be8bcfbc", "8a0da0da2822", "8a0aa0aa2822", "f3cabcabcf3c", "a208a08a2828", "9208a08a2824", "8be8be8bcfa2"];
  const NOISE = "0100110001001111010011110100101100100000010000110100110001001111010100110100010101010010";

  const RAIN_AT  = HIT + CRT_ON;
  const LOGO_AT  = RAIN_AT + RUN + DRAIN;

  const rig    = boot.querySelector(".rig");
  const screen = boot.querySelector(".crt-screen");
  const canvas = screen.querySelector("canvas");
  const disk   = document.getElementById("boot-disk");
  const skip   = boot.querySelector(".boot-skip");
  const hint   = boot.querySelector(".boot-hint");
  const sound  = document.getElementById("boot-sound");
  const ctx    = canvas.getContext("2d");
  const dpr    = Math.min(window.devicePixelRatio || 1, 2);

  if (sound && sound.dataset.src) {
    sound.src = sound.dataset.src;
    sound.preload = "auto";
    sound.volume = VOLUME;
    try { sound.load(); } catch (e) {}
  }

  // ======================================================================
  // rain (drawn inside the CRT screen)
  // ======================================================================
  const map = GLYPH.map((h) =>
    [...h].map((c) => parseInt(c, 16).toString(2).padStart(4, "0")).join("")
  );
  const mapW = Math.max(...map.map((r) => r.length));
  const mapH = map.length;

  let W, H, cell, cols, rowsN, drops, hot, held;

  function size() {
    W = screen.clientWidth;
    H = screen.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cell = Math.max(3, Math.min(14, Math.floor(Math.min((W * 0.88) / mapW, (H * 0.6) / mapH))));
    cols = Math.ceil(W / cell);
    rowsN = Math.ceil(H / cell);

    drops = Array.from({ length: cols }, () => ({
      y: (Math.random() * 0.8 - 0.5) * rowsN,
      v: 0.8 + Math.random() * 0.9,
      k: Math.floor(Math.random() * NOISE.length)
    }));

    hot = new Uint8Array(cols * rowsN);
    held = new Uint8Array(cols * rowsN);
    const ox = Math.floor((cols - mapW) / 2);
    const oy = Math.floor((rowsN - mapH) / 2);
    for (let r = 0; r < mapH; r++) {
      for (let c = 0; c < map[r].length; c++) {
        if (map[r][c] === "1") {
          const gx = ox + c, gy = oy + r;
          if (gx >= 0 && gx < cols && gy >= 0 && gy < rowsN) hot[gy * cols + gx] = 1;
        }
      }
    }
    clear();
  }

  function clear() {
    ctx.fillStyle = "#0b1124";
    ctx.fillRect(0, 0, W, H);
  }

  let lastRain = 0;
  function rain(t, now) {
    const dt = Math.min(3, (now - (lastRain || now - 16.7)) / 16.7);
    lastRain = now;

    ctx.fillStyle = `rgba(11, 17, 36, ${Math.min(0.6, 0.22 * dt)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.font = `${cell}px "VT323", monospace`;
    ctx.textBaseline = "top";

    // rain stops after RUN; trails drain, afterglow stays
    for (let i = 0; t < RUN && i < cols; i++) {
      const d = drops[i];
      const from = Math.floor(d.y);
      d.y += d.v * dt;
      const to = Math.floor(d.y);
      if (d.y > rowsN) { d.y = -Math.random() * rowsN * 0.3; continue; }

      for (let gy = Math.max(0, from); gy <= to && gy < rowsN; gy++) {
        const bit = NOISE[d.k++ % NOISE.length];
        const idx = gy * cols + i;
        if (hot[idx] && !held[idx]) held[idx] = bit === "1" ? 2 : 1;

        const r = Math.random();
        ctx.fillStyle = r < 0.05 ? "#FFBF00" : r < 0.1 ? "#C41E3A" : "rgba(209, 248, 255, 0.55)";
        ctx.fillText(bit, i * cell, gy * cell);
      }
    }

    ctx.fillStyle = `rgba(209, 248, 255, ${GHOST})`;
    for (let idx = 0; idx < held.length; idx++) {
      if (held[idx]) {
        ctx.fillText(held[idx] === 2 ? "1" : "0", (idx % cols) * cell, Math.floor(idx / cols) * cell);
      }
    }
  }

  function logo() {
    clear();
    const fs = Math.floor(W / 9);
    ctx.font = `700 ${fs}px "Silkscreen", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#1A2B56";
    ctx.fillText("BREACHPUNK", W / 2 + fs * 0.06, H / 2 + fs * 0.06);
    ctx.fillStyle = "#FFBF00";
    ctx.fillText("BREACHPUNK", W / 2, H / 2);
    ctx.textAlign = "left";
  }

  // ======================================================================
  // disk
  // ======================================================================
  // how far in the disk is (0 = resting half out, 1 = seated) at time t
  function diskIn(t) {
    const ease = (x) => 1 - Math.pow(1 - x, 3);
    if (t < 1250) return 0.8 * ease(t / 1250);                 // the push
    if (t < 1600) return 0.8 + 0.08 * ((t - 1250) / 350);      // resistance
    if (t < HIT)  return 0.88 + 0.12 * Math.pow((t - 1600) / (HIT - 1600), 2); // snap
    return 1;
  }

  // ======================================================================
  // timeline
  // ======================================================================
  let started = false, t0 = 0, raf = 0, done = false;
  const fired = {};
  const once = (key, fn) => { if (!fired[key]) { fired[key] = true; fn(); } };

  function frame(now) {
    const t = now - t0;

    disk.style.setProperty("--in", diskIn(t).toFixed(4));

    if (t >= HIT) once("seat", () => {
      rig.classList.add("seated");
      screen.classList.add("on");
    });

    if (t >= RAIN_AT && t < LOGO_AT) rain(t - RAIN_AT, now);
    if (t >= LOGO_AT) once("logo", logo);

    if (t >= ZOOM_AT) once("zoom", () => {
      zoom();
      setTimeout(glitchTitle, Math.max(0, GLITCH_AT - t));
    });
    if (t >= ZOOM_AT + ZOOM) once("out", () => finish(false));

    if (!done) raf = requestAnimationFrame(frame);
  }

  function begin(at) {
    if (t0) return;
    t0 = at;
    raf = requestAnimationFrame(frame);
  }

  function insert() {
    if (started || done) return;
    started = true;
    boot.classList.add("inserting");
    disk.disabled = true;
    hint.textContent = "> reading disk...";
    size();

    // sound and picture start together; if the sound can't play, run on the clock
    const fallback = setTimeout(() => begin(performance.now()), 500);
    if (sound && sound.src) {
      try {
        sound.currentTime = 0;
        const p = sound.play();
        const sync = () => {
          clearTimeout(fallback);
          begin(performance.now() - sound.currentTime * 1000);
        };
        if (p && p.then) {
          p.then(() => {
            if (sound.currentTime > 0) sync();
            else sound.addEventListener("playing", sync, { once: true });
          }).catch(() => { clearTimeout(fallback); begin(performance.now()); });
        }
      } catch (e) { clearTimeout(fallback); begin(performance.now()); }
    } else {
      clearTimeout(fallback);
      begin(performance.now());
    }
  }

  // push in until the screen fills the window
  function zoom() {
    clear();
    const s = screen.getBoundingClientRect();
    const r = rig.getBoundingClientRect();
    const scale = Math.max(innerWidth / s.width, innerHeight / s.height) * 1.12;
    const ox = s.left + s.width / 2 - r.left;
    const oy = s.top + s.height / 2 - r.top;
    const dx = innerWidth / 2 - (s.left + s.width / 2);
    const dy = innerHeight / 2 - (s.top + s.height / 2);
    rig.style.transformOrigin = `${ox}px ${oy}px`;
    rig.style.transition = `transform ${ZOOM}ms cubic-bezier(0.7, 0, 0.84, 0)`;
    rig.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    boot.classList.add("zooming");
  }

  function glitchTitle() {
    const g = document.querySelector(".glitch");
    if (!g) return;
    g.classList.add("is-glitching");
    setTimeout(() => g.classList.remove("is-glitching"), 260);
  }

  function finish(skipped) {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    try { sessionStorage.setItem("bp-booted", "1"); } catch (e) {}
    if (skipped && !started && sound) sound.removeAttribute("src");
    boot.style.setProperty("--out", OUT + "ms");
    boot.classList.add("boot-out");
    setTimeout(() => {
      root.classList.remove("booting");
      boot.remove();
    }, OUT);
  }

  disk.addEventListener("click", insert);
  skip.addEventListener("click", () => finish(true));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") finish(true); });
  window.addEventListener("resize", () => { if (started && !fired.zoom) size(); });

  // make sure the fonts are ready before anything is drawn on the screen
  if (document.fonts && document.fonts.load) {
    document.fonts.load('16px "VT323"');
    document.fonts.load('700 16px "Silkscreen"');
  }
})();
