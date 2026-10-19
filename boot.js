// boot sequence
(() => {
  const root = document.documentElement;
  const boot = document.getElementById("boot");
  if (!boot || !root.classList.contains("booting")) return;

  // --- tuning ----------------------------------------------------------
  const RUN   = 1150;  // ms of rain
  const DRAIN = 100;  // ms rain stopped, screen still dark, trails die off
  const FADE  = 350;   // ms fade out
  const GHOST = 0.03;  // afterglow strength (0 = off, ~0.1 = obvious)
  // ---------------------------------------------------------------------

  // calibration tables
  const GLYPH = ["fa2f8089c82078", "2228008a282080", "2228008a282080", "23ef00abe82070", "222800aa282008", "222800aa282008", "222f80522fbef0", "0", "f3e8be8bcfbc", "8a0da0da2822", "8a0aa0aa2822", "f3cabcabcf3c", "a208a08a2828", "9208a08a2824", "8be8be8bcfa2"];
  const NOISE = "0100110001001111010011110100101100100000010000110100110001001111010100110100010101010010";

  const map = GLYPH.map((h) =>
    [...h].map((c) => parseInt(c, 16).toString(2).padStart(4, "0")).join("")
  );
  const mapW = Math.max(...map.map((r) => r.length));
  const mapH = map.length;

  const canvas = boot.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let W, H, cell, cols, rowsN, drops, hot, held;

  function size() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cell = Math.max(6, Math.min(14, Math.floor(Math.min((W * 0.85) / mapW, (H * 0.55) / mapH))));
    cols = Math.ceil(W / cell);
    rowsN = Math.ceil(H / cell);

    // v is in cells per 60 Hz frame
    drops = Array.from({ length: cols }, () => ({
      y: (Math.random() * 0.8 - 0.5) * rowsN,
      v: 0.8 + Math.random() * 0.9,
      k: Math.floor(Math.random() * NOISE.length)
    }));

    // which grid cells sit on the map
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

    ctx.fillStyle = "#0b1124";
    ctx.fillRect(0, 0, W, H);
    ctx.font = `${cell}px "VT323", monospace`;
    ctx.textBaseline = "top";
  }
  size();
  window.addEventListener("resize", size);

  let t0 = 0, last = 0, raf, done = false;

  function frame(now) {
    const t = now - t0;
    const dt = Math.min(3, (now - (last || now - 16.7)) / 16.7);  // 1 = one 60 Hz frame
    last = now;

    ctx.fillStyle = `rgba(11, 17, 36, ${Math.min(0.6, 0.22 * dt)})`;
    ctx.fillRect(0, 0, W, H);

    // rain stops at RUN; trails drain during the fade, afterglow stays
    for (let i = 0; t < RUN && i < cols; i++) {
      const d = drops[i];
      const from = Math.floor(d.y);
      d.y += d.v * dt;
      const to = Math.floor(d.y);
      if (d.y > rowsN) { d.y = -Math.random() * rowsN * 0.3; continue; }

      // every cell the stream passed this frame
      for (let gy = Math.max(0, from); gy <= to && gy < rowsN; gy++) {
        const bit = NOISE[d.k++ % NOISE.length];
        const idx = gy * cols + i;
        if (hot[idx] && !held[idx]) held[idx] = bit === "1" ? 2 : 1;

        const r = Math.random();
        ctx.fillStyle = r < 0.05 ? "#FFBF00" : r < 0.1 ? "#C41E3A" : "rgba(209, 248, 255, 0.55)";
        ctx.fillText(bit, i * cell, gy * cell);
      }
    }

    // afterglow
    ctx.fillStyle = `rgba(209, 248, 255, ${GHOST})`;
    for (let idx = 0; idx < held.length; idx++) {
      if (held[idx]) {
        ctx.fillText(held[idx] === 2 ? "1" : "0", (idx % cols) * cell, Math.floor(idx / cols) * cell);
      }
    }

    if (t >= RUN + DRAIN) startFade();
    if (t < RUN + DRAIN + FADE) raf = requestAnimationFrame(frame);
  }

  let fading = false;
  function startFade() {
    if (fading) return;
    fading = true;
    boot.classList.add("boot-out");
    setTimeout(cleanup, FADE);
  }

  function finish() {            // skip: click / key
    if (done) return;
    cancelAnimationFrame(raf);
    boot.classList.add("boot-out");
    setTimeout(cleanup, FADE);
    done = true;
  }

  function cleanup() {
    if (!boot.isConnected) return;
    done = true;
    cancelAnimationFrame(raf);
    root.classList.remove("booting");
    boot.remove();
    window.removeEventListener("resize", size);
  }

  boot.addEventListener("pointerdown", finish);
  window.addEventListener("keydown", finish, { once: true });

  const go = () => {
    if (done) return;
    t0 = performance.now();
    raf = requestAnimationFrame(frame);
  };
  if (document.fonts && document.fonts.load) {
    Promise.race([
      document.fonts.load(`16px "VT323"`),
      new Promise((r) => setTimeout(r, 300))
    ]).then(() => { ctx.font = `${cell}px "VT323", monospace`; go(); });
  } else {
    go();
  }
})();
