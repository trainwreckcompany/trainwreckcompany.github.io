// BREACHPUNK — site scripts
// 1) typewriter lore terminal  2) glitching title  3) HEINDE's eye + observer counter

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- footer year ----------
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- 1. lore terminal ----------
  // Edit these lines to change the lore. Each string is one line.
  const LORE = [
    "> decrypting archive...",
    "> OK",
    "",
    "YEAR 3528 N.D.D. — NOS DONUM DUCO.",
    "",
    "Humanity rebuilt the planet into a single city.",
    "An ancient AI called HEINDE keeps it running.",
    "",
    "Art is banned. Books are banned.",
    "Thinking is discouraged.",
    "",
    "The rich still live up top. For now.",
    "",
    "> you are in the remnants.",
    "> find a wall."
  ];

  const loreEl = document.getElementById("lore");

  function typeLore() {
    if (!loreEl) return;
    const full = LORE.join("\n");

    if (reduceMotion) {
      loreEl.textContent = full;
      return;
    }

    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.innerHTML = "&nbsp;";

    let i = 0;
    const text = document.createTextNode("");
    loreEl.textContent = "";
    loreEl.append(text, cursor);

    const step = () => {
      if (i >= full.length) return;
      text.data += full[i];
      const ch = full[i++];
      // pause longer on line breaks so it reads like a terminal
      setTimeout(step, ch === "\n" ? 220 : 22 + Math.random() * 28);
    };
    step();
  }

  // start typing only when the terminal scrolls into view
  if (loreEl && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        typeLore();
      }
    }, { threshold: 0.3 });
    io.observe(loreEl);
  } else {
    typeLore();
  }

  // ---------- 2. glitching title ----------
  const glitch = document.querySelector(".glitch");
  if (glitch && !reduceMotion) {
    const burst = () => {
      glitch.classList.add("is-glitching");
      setTimeout(() => glitch.classList.remove("is-glitching"), 120 + Math.random() * 180);
      setTimeout(burst, 1800 + Math.random() * 3500);
    };
    setTimeout(burst, 1200);
  }

  // ---------- 3. HEINDE's eye ----------
  const pupil = document.querySelector(".pupil");
  const eye = document.querySelector(".eye");
  if (pupil && eye && !reduceMotion) {
    window.addEventListener("pointermove", (e) => {
      const r = eye.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const a = Math.atan2(dy, dx);
      pupil.style.transform = `translate(${Math.cos(a) * 6}px, ${Math.sin(a) * 2.5}px)`;
    });
  }

  // fake "citizens observed" counter — purely cosmetic
  const countEl = document.getElementById("watch-count");
  if (countEl) {
    let n = 8_000_000_000 + Math.floor(Math.random() * 999_999);
    const fmt = (v) => v.toLocaleString("en-US");
    countEl.textContent = fmt(n);
    setInterval(() => {
      n += Math.floor(Math.random() * 40);
      countEl.textContent = fmt(n);
    }, 900);
  }
})();
