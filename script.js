(() => {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let currentLanguage = "ar";
  let toastTimer;

  const dictionary = {
    rag: {
      term: "RAG",
      meta: "AI / INTERMEDIATE",
      arTitle: "التوليد المعزّز بالاسترجاع",
      enTitle: "Retrieval-Augmented Generation",
      arBody: "أسلوب يبحث في مصادر محددة ثم يقدّم المعلومات للنموذج قبل بناء الإجابة.",
      enBody: "A method that retrieves information from selected sources before the model builds its answer.",
      related: ["EMBEDDING", "VECTOR DB", "LLM"]
    },
    api: {
      term: "API",
      meta: "WEB / BEGINNER",
      arTitle: "واجهة برمجة التطبيقات",
      enTitle: "Application Programming Interface",
      arBody: "عقد واضح يسمح لبرنامج بطلب بيانات أو وظائف من برنامج آخر.",
      enBody: "A clear contract that lets one program request data or capabilities from another.",
      related: ["HTTP", "JSON", "SDK"]
    },
    agent: {
      term: "AGENT",
      meta: "AI / INTERMEDIATE",
      arTitle: "وكيل ذكاء اصطناعي",
      enTitle: "AI Agent",
      arBody: "نظام يستخدم نموذجًا وأدوات وخطوات متتابعة لإنجاز هدف تحت حدود يحددها المستخدم.",
      enBody: "A system that uses a model, tools, and sequential steps to pursue a user-defined goal.",
      related: ["LLM", "TOOL USE", "MEMORY"]
    },
    embedding: {
      term: "EMBEDDING",
      meta: "AI / INTERMEDIATE",
      arTitle: "تمثيل عددي للمعنى",
      enTitle: "Numerical Meaning Representation",
      arBody: "تحويل نص أو صورة إلى أرقام تساعد الحاسوب على مقارنة التشابه الدلالي.",
      enBody: "A conversion of text or images into numbers that support semantic similarity comparisons.",
      related: ["VECTOR DB", "SIMILARITY", "RAG"]
    }
  };

  function safeStorage(action, key, value) {
    try {
      if (action === "get") return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (_) {
      return null;
    }
    return value;
  }

  function showToast(arMessage, enMessage = arMessage) {
    const toast = document.querySelector("[data-toast]");
    if (!toast) return;
    toast.textContent = currentLanguage === "ar" ? arMessage : enMessage;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2300);
  }

  function setLanguage(language, persist = true) {
    currentLanguage = language === "en" ? "en" : "ar";
    root.lang = currentLanguage;
    root.dir = currentLanguage === "ar" ? "rtl" : "ltr";

    document.querySelectorAll("[data-ar][data-en]").forEach((element) => {
      element.textContent = element.dataset[currentLanguage];
    });

    document.querySelectorAll("[data-placeholder-ar][data-placeholder-en]").forEach((element) => {
      element.placeholder = element.dataset[`placeholder${currentLanguage === "ar" ? "Ar" : "En"}`];
    });

    document.querySelectorAll("[data-lang]").forEach((button) => {
      const active = button.dataset.lang === currentLanguage;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    const search = document.querySelector("[data-dictionary-search]");
    if (search && search.value.trim()) updateDictionary(search.value);
    if (persist) safeStorage("set", "aifrahat-language", currentLanguage);
  }

  function setTheme(theme, persist = true) {
    const nextTheme = theme === "light" ? "light" : "dark";
    root.dataset.theme = nextTheme;
    const icon = document.querySelector(".theme-icon");
    if (icon) icon.textContent = nextTheme === "dark" ? "◐" : "◑";
    const toggle = document.querySelector("[data-theme-toggle]");
    if (toggle) {
      toggle.setAttribute("aria-label", nextTheme === "dark" ? "Switch to light interface" : "Switch to dark interface");
    }
    if (persist) safeStorage("set", "aifrahat-theme", nextTheme);
  }

  function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      "\"": "&quot;"
    })[character]);
  }

  function updateDictionary(rawQuery) {
    const query = rawQuery.toLowerCase().trim();
    const key = Object.keys(dictionary).find((entry) => query.includes(entry)) || "rag";
    const item = dictionary[key];
    const result = document.querySelector("[data-dictionary-result]");
    if (!result) return;

    const title = currentLanguage === "ar" ? item.arTitle : item.enTitle;
    const body = currentLanguage === "ar" ? item.arBody : item.enBody;
    result.innerHTML = `
      <div class="term-row"><span>${escapeHtml(item.term)}</span><em>${escapeHtml(item.meta)}</em></div>
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(body)}</p>
      <div class="related-row">${item.related.map((term) => `<span>${escapeHtml(term)}</span>`).join("")}</div>
    `;
  }

  function initDictionary() {
    const input = document.querySelector("[data-dictionary-search]");
    if (!input) return;
    input.addEventListener("input", () => updateDictionary(input.value));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        updateDictionary(input.value);
        showToast("تم البحث داخل نموذج القاموس", "Dictionary preview searched");
      }
    });
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function updateSimulation(announce = false) {
    const chunkInput = document.querySelector("[data-chunk]");
    const topKInput = document.querySelector("[data-topk]");
    const rerankerInput = document.querySelector("[data-reranker]");
    if (!chunkInput || !topKInput || !rerankerInput) return;

    const chunk = Number(chunkInput.value);
    const topK = Number(topKInput.value);
    const reranker = rerankerInput.checked;
    const score = Math.round(clamp(77 + (reranker ? 9 : 0) - Math.abs(topK - 7) * 1.15 - Math.abs(chunk - 520) / 115, 51, 96));
    const precision = Math.round(clamp(83 + (reranker ? 8 : 0) - Math.max(0, topK - 5) * 1.6 - Math.abs(chunk - 440) / 160, 50, 96));
    const recall = Math.round(clamp(67 + topK * 3 - Math.abs(chunk - 600) / 170, 52, 97));
    const latency = Math.round(42 + topK * 12 + chunk * 0.055 + (reranker ? 47 : 0));
    const context = (chunk * topK / 1000).toFixed(1);

    document.querySelector("[data-chunk-output]").textContent = chunk;
    document.querySelector("[data-topk-output]").textContent = topK;
    document.querySelector("[data-score]").textContent = score;
    document.querySelector("[data-precision]").textContent = `${precision}%`;
    document.querySelector("[data-recall]").textContent = `${recall}%`;
    document.querySelector("[data-latency]").textContent = `${latency}ms`;
    document.querySelector("[data-context]").textContent = `${context}K`;

    const bar = document.querySelector("[data-score-bar]");
    bar.style.width = `${score}%`;
    bar.style.background = score >= 82 ? "var(--acid)" : score >= 70 ? "var(--cyan)" : "var(--orange)";
    const label = document.querySelector("[data-score-label]");
    label.textContent = score >= 82 ? "STRONG" : score >= 70 ? "BALANCED" : "FRAGILE";

    const relevance = [
      clamp(score + 5, 0, 99),
      clamp(score - 2, 0, 96),
      clamp(score - 17, 0, 92),
      clamp(score - 38, 0, 88)
    ];
    document.querySelectorAll(".retrieval-bars > div").forEach((row, index) => {
      const value = relevance[index] / 100;
      row.querySelector("b").style.setProperty("--value", `${relevance[index]}%`);
      row.querySelector("em").textContent = value.toFixed(2);
    });

    if (announce) {
      showToast("اكتملت المحاكاة وتم تحديث النتائج", "Simulation complete; results updated");
    }
  }

  function initLab() {
    const tabs = document.querySelectorAll("[data-lab-tab]");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
        document.querySelectorAll("[data-lab-panel]").forEach((panel) => {
          panel.classList.toggle("is-active", panel.dataset.labPanel === tab.dataset.labTab);
        });
      });
    });

    document.querySelectorAll("[data-chunk], [data-topk], [data-reranker]").forEach((control) => {
      control.addEventListener("input", () => updateSimulation(false));
      control.addEventListener("change", () => updateSimulation(false));
    });

    const runButton = document.querySelector("[data-run-simulation]");
    if (runButton) {
      runButton.addEventListener("click", () => {
        runButton.disabled = true;
        runButton.style.opacity = "0.65";
        window.setTimeout(() => {
          updateSimulation(true);
          runButton.disabled = false;
          runButton.style.opacity = "1";
        }, reduceMotion ? 10 : 520);
      });
    }

    const traceButton = document.querySelector("[data-run-trace]");
    if (traceButton) {
      traceButton.addEventListener("click", async () => {
        if (traceButton.disabled) return;
        traceButton.disabled = true;
        const steps = [...document.querySelectorAll(".trace-step")];
        steps.forEach((step) => {
          step.classList.remove("is-ready", "is-running", "is-done");
          step.querySelector("em").textContent = "WAIT";
        });

        for (const step of steps) {
          step.classList.add("is-running");
          step.querySelector("em").textContent = "RUN";
          await new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 20 : 430));
          step.classList.remove("is-running");
          step.classList.add("is-done");
          step.querySelector("em").textContent = "DONE";
        }

        traceButton.disabled = false;
        showToast("اكتمل المسار وأصبح قابلًا للمراجعة", "Trace complete and ready for review");
      });
    }

    updateSimulation(false);
  }

  function initCommandPalette() {
    const dialog = document.querySelector("[data-command-dialog]");
    const input = document.querySelector("[data-command-input]");
    const buttons = [...document.querySelectorAll("[data-command-list] button")];
    if (!dialog || !input) return;

    const open = () => {
      if (!dialog.open) dialog.showModal();
      input.value = "";
      buttons.forEach((button) => { button.hidden = false; });
      window.setTimeout(() => input.focus(), 20);
    };

    document.querySelectorAll("[data-open-command]").forEach((button) => button.addEventListener("click", open));
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open();
      }
    });

    input.addEventListener("input", () => {
      const query = input.value.toLowerCase().trim();
      buttons.forEach((button) => {
        button.hidden = !button.textContent.toLowerCase().includes(query);
      });
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        dialog.close();
        if (button.dataset.commandTarget) {
          document.querySelector(button.dataset.commandTarget)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        } else if (button.dataset.commandUrl) {
          window.open(button.dataset.commandUrl, "_blank", "noopener");
        }
      });
    });
  }

  function initNavigation() {
    const menuButton = document.querySelector("[data-menu-toggle]");
    const mobileNav = document.querySelector("[data-mobile-nav]");
    if (menuButton && mobileNav) {
      menuButton.addEventListener("click", () => {
        const open = mobileNav.classList.toggle("is-open");
        menuButton.setAttribute("aria-expanded", String(open));
      });
      mobileNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
        mobileNav.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
      }));
    }

    document.querySelectorAll("[data-lang]").forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.lang));
    });

    document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
      setTheme(root.dataset.theme === "dark" ? "light" : "dark");
    });
  }

  function initRevealAndCounters() {
    const reveals = document.querySelectorAll(".reveal");
    const counters = document.querySelectorAll("[data-counter]");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach((element) => element.classList.add("is-visible"));
      counters.forEach((counter) => { counter.textContent = counter.dataset.counter; });
      return;
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.13 });
    reveals.forEach((element) => revealObserver.observe(element));

    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const counter = entry.target;
        const target = Number(counter.dataset.counter);
        const start = performance.now();
        const duration = 900;
        const tick = (now) => {
          const progress = clamp((now - start) / duration, 0, 1);
          counter.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.unobserve(counter);
      });
    }, { threshold: 0.8 });
    counters.forEach((counter) => counterObserver.observe(counter));
  }

  function initClipboard() {
    const button = document.querySelector("[data-copy-repo]");
    if (!button) return;
    button.addEventListener("click", async () => {
      const url = "https://github.com/AiFrahat/aifrahat";
      try {
        await navigator.clipboard.writeText(url);
      } catch (_) {
        const helper = document.createElement("textarea");
        helper.value = url;
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        helper.remove();
      }
      showToast("تم نسخ رابط الريبو", "Repository URL copied");
    });
  }

  function initNetwork() {
    const canvas = document.querySelector("[data-network]");
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    const colors = ["#c8ff36", "#2bc7d8", "#ff6b35", "#ff4f8b", "#ffffff"];
    const labels = ["RAG", "EVAL", "AGENT", "LLM", "HCI", "DATA", "TOOLS", "ALIGN"];
    const nodes = [];
    const pointer = { x: -1000, y: -1000, active: false };
    let width = 0;
    let height = 0;
    let frame = 0;
    let running = true;

    function seeded(index) {
      const value = Math.sin(index * 999.91) * 43758.5453;
      return value - Math.floor(value);
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes.length = 0;
      const count = width < 700 ? 24 : 42;
      for (let index = 0; index < count; index += 1) {
        nodes.push({
          x: seeded(index + 1) * width,
          y: seeded(index + 101) * height,
          vx: (seeded(index + 201) - 0.5) * 0.22,
          vy: (seeded(index + 301) - 0.5) * 0.22,
          r: 1.5 + seeded(index + 401) * 2.2,
          color: colors[index % colors.length],
          label: index % 6 === 0 ? labels[(index / 6) % labels.length] : ""
        });
      }
      draw();
    }

    function draw() {
      context.clearRect(0, 0, width, height);
      const connectionDistance = width < 700 ? 112 : 154;

      for (let first = 0; first < nodes.length; first += 1) {
        const node = nodes[first];
        for (let second = first + 1; second < nodes.length; second += 1) {
          const other = nodes[second];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distance = Math.hypot(dx, dy);
          if (distance < connectionDistance) {
            context.strokeStyle = `rgba(130, 146, 158, ${0.24 * (1 - distance / connectionDistance)})`;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(node.x, node.y);
            context.lineTo(other.x, other.y);
            context.stroke();
          }
        }

        context.fillStyle = node.color;
        context.beginPath();
        context.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        context.fill();

        if (node.label) {
          context.fillStyle = "rgba(255,255,255,.46)";
          context.font = "9px Cascadia Code, Consolas, monospace";
          context.fillText(node.label, node.x + 8, node.y - 7);
        }
      }
    }

    function animate() {
      if (!running) return;
      frame = requestAnimationFrame(animate);
      nodes.forEach((node) => {
        if (pointer.active) {
          const dx = node.x - pointer.x;
          const dy = node.y - pointer.y;
          const distance = Math.max(1, Math.hypot(dx, dy));
          if (distance < 130) {
            node.vx += (dx / distance) * 0.018;
            node.vy += (dy / distance) * 0.018;
          }
        }
        node.vx *= 0.995;
        node.vy *= 0.995;
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < -10) node.x = width + 10;
        if (node.x > width + 10) node.x = -10;
        if (node.y < -10) node.y = height + 10;
        if (node.y > height + 10) node.y = -10;
      });
      draw();
    }

    canvas.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    });
    canvas.addEventListener("pointerleave", () => { pointer.active = false; });
    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
      if (running && !reduceMotion) animate();
      if (!running) cancelAnimationFrame(frame);
    });

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    if (!reduceMotion) animate();
  }

  document.querySelector("[data-year]").textContent = new Date().getFullYear();
  setLanguage(safeStorage("get", "aifrahat-language") || "ar", false);
  setTheme(safeStorage("get", "aifrahat-theme") || "dark", false);
  initNavigation();
  initDictionary();
  initLab();
  initCommandPalette();
  initRevealAndCounters();
  initClipboard();
  initNetwork();
})();
