/* =====================================================================
   motion-init.js — TREMENDVZ
   Custom gold cursor + scroll reveals + efeitos medievais.
   Usa a lib Motion (motion.dev) via CDN quando disponível,
   e cai para CSS puro + IntersectionObserver como fallback.
   ===================================================================== */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasMotion = typeof window.Motion !== "undefined";
  var animate = hasMotion ? window.Motion.animate : null;

  /* ── 1. CURSOR DOURADO PERSONALIZADO ─────────────────────────────
     Ponto central (segue o mouse em tempo real) +
     anel externo (segue com lag suave via lerp).
     Bug original: hero-bg e overlays sem pointer-events:none
     faziam o cursor OS sumir. Agora o cursor customizado substitui
     completamente — e fica belíssimo com a estética medieval.
     ─────────────────────────────────────────────────────────────── */
  function initCustomCursor() {
    if (prefersReduced) return;
    if (window.matchMedia("(pointer: coarse)").matches) {
      // Mobile: restaura cursor padrão e sai
      document.documentElement.style.cursor = "auto";
      return;
    }

    var dot  = document.createElement("div");
    var ring = document.createElement("div");
    dot.className  = "cursor-dot";
    ring.className = "cursor-ring";
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mx = -200, my = -200; // posição do mouse (começa fora da tela)
    var rx = -200, ry = -200; // posição do anel (interpolada)
    var visible = false;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function loop() {
      // Anel segue com lerp (lag suave)
      rx = lerp(rx, mx, 0.10);
      ry = lerp(ry, my, 0.10);

      dot.style.transform  = "translate(calc(" + mx + "px - 50%), calc(" + my + "px - 50%))";
      ring.style.transform = "translate(calc(" + rx + "px - 50%), calc(" + ry + "px - 50%))";
      requestAnimationFrame(loop);
    }

    document.addEventListener("mousemove", function (e) {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity  = "1";
        ring.style.opacity = "1";
      }
    });

    // Hover em elementos interativos → expande cursor
    var hoverEls = document.querySelectorAll(
      "a, button, [role='button'], .track, .photo-tile, .release-toggle, input, select"
    );
    hoverEls.forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        document.body.classList.add("cursor-hover");
      });
      el.addEventListener("mouseleave", function () {
        document.body.classList.remove("cursor-hover");
      });
    });

    // Clique → contrai cursor
    document.addEventListener("mousedown", function () {
      document.body.classList.add("cursor-click");
    });
    document.addEventListener("mouseup", function () {
      document.body.classList.remove("cursor-click");
    });

    // Sai da janela → esconde cursor
    document.addEventListener("mouseleave", function () {
      dot.style.opacity  = "0";
      ring.style.opacity = "0";
      visible = false;
    });
    document.addEventListener("mouseenter", function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.opacity  = "1";
      ring.style.opacity = "1";
      visible = true;
    });

    loop();
  }

  /* ── 2. SCROLL REVEAL ─────────────────────────────────────────────
     Elementos com [data-motion] entram suavemente ao cruzar viewport.
     ─────────────────────────────────────────────────────────────── */
  function initScrollReveal() {
    var els = document.querySelectorAll("[data-motion]");
    if (!els.length) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in-view"); });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          io.unobserve(el);

          if (hasMotion && animate && !prefersReduced) {
            var type = el.getAttribute("data-motion");
            var delay = parseInt((el.style.getPropertyValue("--delay") || "0"), 10);
            var fromY  = type === "fade-up"   ? 28 : 0;
            var fromSc = type === "scale-in"  ? 0.94 : 1;

            animate(
              el,
              {
                opacity:   [0, 1],
                transform: [
                  "translateY(" + fromY + "px) scale(" + fromSc + ")",
                  "translateY(0px) scale(1)"
                ]
              },
              {
                duration: 0.72,
                delay: delay / 1000,
                easing: [0.16, 1, 0.3, 1]
              }
            );
            // Garante visibilidade mesmo se Motion não setar inline
            setTimeout(function () { el.classList.add("in-view"); }, delay + 50);
          } else {
            el.classList.add("in-view");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach(function (el) { io.observe(el); });
  }

  /* ── 3. HEADER: vidro ao rolar ────────────────────────────────────  */
  function initHeaderGlass() {
    var nav = document.querySelector(".site-nav");
    if (!nav) return;
    var update = function () {
      nav.classList.toggle("nav--scrolled", window.scrollY > 16);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ── 4. CARD TILT 3D (só desktop) ────────────────────────────────
     Leve inclinação 3D seguindo o mouse em cima das feature-cards.
     ─────────────────────────────────────────────────────────────── */
  function initCardTilt() {
    if (prefersReduced) return;
    if (!hasMotion || !animate) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    var cards = document.querySelectorAll(
      ".feature-card, .manifest-card, .discography-card"
    );

    cards.forEach(function (card) {
      card.style.transformStyle = "preserve-3d";
      card.style.perspective = "700px";

      card.addEventListener("mousemove", function (e) {
        var r  = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width  - 0.5;
        var py = (e.clientY - r.top)  / r.height - 0.5;
        animate(
          card,
          { transform: ["rotateX(" + (-py * 5) + "deg) rotateY(" + (px * 7) + "deg) translateY(-4px)"] },
          { duration: 0.2, easing: "ease-out" }
        );
      });

      card.addEventListener("mouseleave", function () {
        animate(
          card,
          { transform: ["rotateX(0deg) rotateY(0deg) translateY(0)"] },
          { duration: 0.45, easing: [0.34, 1.56, 0.64, 1] }
        );
      });
    });
  }

  /* ── 5. HERO: animação de entrada das partículas de texto ─────────
     O hero-frame já tem data-motion="fade-up", mas vamos adicionar
     um pequeno delay nos filhos para criar uma cascata.
     ─────────────────────────────────────────────────────────────── */
  function initHeroEntrance() {
    if (prefersReduced) return;
    if (!hasMotion || !animate) return;

    var children = document.querySelectorAll(
      ".hero-frame > *, .hero-status"
    );

    children.forEach(function (el, i) {
      if (hasMotion && animate) {
        animate(
          el,
          { opacity: [0, 1], transform: ["translateY(22px)", "translateY(0)"] },
          {
            duration: 0.75,
            delay: 0.1 + i * 0.08,
            easing: [0.16, 1, 0.3, 1]
          }
        );
      }
    });
  }

  /* ── 6. ALBUM ART: shimmer dourado girando lentamente ────────────  */
  function initAlbumGlow() {
    if (prefersReduced) return;
    var wrap = document.querySelector(".album-art-wrap");
    if (!wrap) return;

    var glow = document.createElement("div");
    glow.style.cssText = [
      "position:absolute",
      "inset:-2px",
      "border-radius:2px",
      "pointer-events:none",
      "z-index:2",
      "background:conic-gradient(from 0deg, transparent 0%, rgba(215,174,69,0.6) 20%, transparent 40%)",
      "opacity:0",
      "transition:opacity 0.4s ease"
    ].join(";");

    wrap.style.position = "relative";
    wrap.appendChild(glow);

    if (hasMotion && animate && !prefersReduced) {
      animate(
        glow,
        { rotate: ["0deg", "360deg"] },
        { duration: 4, repeat: Infinity, easing: "linear" }
      );
    }

    wrap.addEventListener("mouseenter", function () { glow.style.opacity = "1"; });
    wrap.addEventListener("mouseleave", function () { glow.style.opacity = "0"; });
  }

  /* ── Init ─────────────────────────────────────────────────────────  */
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    initCustomCursor();
    initScrollReveal();
    initHeaderGlass();
    initCardTilt();
    initHeroEntrance();
    initAlbumGlow();
  });

})();
