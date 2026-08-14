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
      kicker: "Molecular dynamics",
      caption: "Following atoms through time."
    },
    hpc: {
      kicker: "High-performance computing",
      caption: "Scaling scientific questions across systems."
    },
    ml: {
      kicker: "Machine learning",
      caption: "Finding compact structure in complex data."
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

  const draw = () => {
    context.clearRect(0, 0, width, height);
    const ink = cssColor("--ink");
    const accent = cssColor("--accent");

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
