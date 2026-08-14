(() => {
  const root = document.documentElement;
  const header = document.querySelector("[data-header]");
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const savedTheme = localStorage.getItem("ali-portfolio-theme");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = savedTheme || (systemDark ? "dark" : "light");
  root.dataset.theme = initialTheme;

  themeToggle?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("ali-portfolio-theme", next);
  });

  const closeMenu = () => {
    menuToggle?.setAttribute("aria-expanded", "false");
    nav?.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  menuToggle?.addEventListener("click", () => {
    const open = menuToggle.getAttribute("aria-expanded") !== "true";
    menuToggle.setAttribute("aria-expanded", String(open));
    nav?.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  });

  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 18);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  document.querySelectorAll("[data-delay]").forEach((element) => {
    element.style.setProperty("--delay", `${element.dataset.delay}ms`);
  });

  const revealElements = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px" });
    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  document.querySelector("[data-year]").textContent = new Date().getFullYear();

  const focusVisual = document.querySelector("[data-research-focus]");
  const hero = document.querySelector("[data-hero]");
  const focusButtons = [...document.querySelectorAll("[data-focus-option]")];
  const focusKicker = document.querySelector("[data-focus-kicker]");
  const focusCaption = document.querySelector("[data-focus-caption]");
  const focusContent = {
    md: {
      kicker: "Atomistic simulation",
      caption: "Resolving molecular structure and motion across interacting time scales."
    },
    hpc: {
      kicker: "Parallel simulation at scale",
      caption: "Using parallel computing to process, explore, and interact efficiently with large-scale scientific data."
    },
    ml: {
      kicker: "Neural representation learning",
      caption: "Optimizing neural networks for stronger task-specific performance under practical computational constraints."
    }
  };
  let focusSwitchTimer;

  const applyFocus = (focus) => {
    focusVisual.dataset.focus = focus;
    hero.dataset.focus = focus;
    focusKicker.textContent = focusContent[focus].kicker;
    focusCaption.textContent = focusContent[focus].caption;
    focusButtons.forEach((button) => {
      const active = button.dataset.focusOption === focus;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-checked", String(active));
      button.tabIndex = active ? 0 : -1;
    });
  };

  const selectFocus = (focus, immediate = false) => {
    if (!focusVisual || !focusContent[focus] || focusVisual.dataset.focus === focus) return;
    window.clearTimeout(focusSwitchTimer);
    applyFocus(focus);
    if (immediate || reducedMotion.matches) {
      focusVisual.classList.remove("is-switching");
      return;
    }
    focusVisual.classList.add("is-switching");
    focusSwitchTimer = window.setTimeout(() => focusVisual.classList.remove("is-switching"), 260);
  };

  focusButtons.forEach((button, index) => {
    button.addEventListener("click", () => selectFocus(button.dataset.focusOption));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      const direction = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
      const next = focusButtons[(index + direction + focusButtons.length) % focusButtons.length];
      next.focus();
      selectFocus(next.dataset.focusOption);
    });
  });

  const requestedFocus = new URLSearchParams(window.location.search).get("focus");
  if (focusContent[requestedFocus] && requestedFocus !== "md") selectFocus(requestedFocus, true);

  const canvas = document.querySelector("[data-particles]");
  if (!canvas || reducedMotion.matches) return;

  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let particles = [];
  let frame;
  let pointer = { x: -1000, y: -1000 };

  const cssColor = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  const makeParticles = () => {
    const count = Math.min(55, Math.max(24, Math.round(width / 27)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      radius: Math.random() * 1.5 + 0.6
    }));
  };

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    makeParticles();
  };

  const drawMolecularField = (ink, accent) => {
    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < -10) particle.x = width + 10;
      if (particle.x > width + 10) particle.x = -10;
      if (particle.y < -10) particle.y = height + 10;
      if (particle.y > height + 10) particle.y = -10;

      const pointerDistance = Math.hypot(particle.x - pointer.x, particle.y - pointer.y);
      if (pointerDistance < 120) {
        particle.x += (particle.x - pointer.x) * 0.0025;
        particle.y += (particle.y - pointer.y) * 0.0025;
      }

      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = index % 9 === 0 ? accent : ink;
      context.globalAlpha = index % 9 === 0 ? 0.75 : 0.32;
      context.fill();

      for (let nextIndex = index + 1; nextIndex < particles.length; nextIndex += 1) {
        const next = particles[nextIndex];
        const distance = Math.hypot(particle.x - next.x, particle.y - next.y);
        if (distance > 125) continue;
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(next.x, next.y);
        context.strokeStyle = ink;
        context.globalAlpha = (1 - distance / 125) * 0.13;
        context.lineWidth = 0.7;
        context.stroke();
      }
    });
  };

  const drawComputeField = (ink, time) => {
    const color = "#48d6ff";
    const compact = width < 760;
    const startX = compact ? width * 0.08 : width * 0.53;
    const endX = width * 0.97;
    const startY = compact ? 82 : height * 0.12;
    const endY = height * 0.9;
    const gap = compact ? 48 : 58;
    const columns = Math.max(2, Math.floor((endX - startX) / gap));
    const rows = Math.max(3, Math.floor((endY - startY) / gap));

    context.strokeStyle = ink;
    context.lineWidth = 0.65;
    context.globalAlpha = 0.075;
    for (let column = 0; column <= columns; column += 1) {
      const x = startX + column * gap;
      context.beginPath();
      context.moveTo(x, startY);
      context.lineTo(x, startY + rows * gap);
      context.stroke();
    }
    for (let row = 0; row <= rows; row += 1) {
      const y = startY + row * gap;
      context.beginPath();
      context.moveTo(startX, y);
      context.lineTo(startX + columns * gap, y);
      context.stroke();
    }

    for (let row = 0; row <= rows; row += 1) {
      for (let column = 0; column <= columns; column += 1) {
        const x = startX + column * gap;
        const y = startY + row * gap;
        context.fillStyle = (row + column) % 7 === 0 ? color : ink;
        context.globalAlpha = (row + column) % 7 === 0 ? 0.45 : 0.16;
        context.fillRect(x - 2, y - 2, 4, 4);
      }
    }

    const progress = (time * 0.00018) % 1;
    for (let row = 0; row <= rows; row += 2) {
      const direction = row % 4 === 0 ? progress : 1 - progress;
      const x = startX + direction * columns * gap;
      const y = startY + row * gap;
      context.fillStyle = color;
      context.globalAlpha = 0.68;
      context.fillRect(x - 11, y - 2, 22, 4);
    }

    const scanColumn = Math.floor((time * 0.0012) % (columns + 1));
    context.fillStyle = color;
    context.globalAlpha = 0.06;
    context.fillRect(startX + scanColumn * gap - gap / 2, startY, gap, rows * gap);
  };

  const draw = (timestamp = performance.now()) => {
    context.clearRect(0, 0, width, height);
    const ink = cssColor("--ink");
    const accent = cssColor("--accent");
    const mode = hero?.dataset.focus || "md";

    if (mode === "hpc") drawComputeField(ink, timestamp);
    else if (mode === "md") drawMolecularField(ink, accent);

    context.globalAlpha = 1;
    frame = requestAnimationFrame(draw);
  };

  const updatePointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  window.addEventListener("resize", resize);
  canvas.parentElement.addEventListener("pointermove", updatePointer, { passive: true });
  canvas.parentElement.addEventListener("pointerleave", () => { pointer = { x: -1000, y: -1000 }; });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else draw();
  });

  resize();
  draw();
})();
