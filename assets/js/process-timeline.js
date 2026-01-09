(function () {
  function initProcessTimeline(steps, defaultStepKey) {
    if (!steps) return;

    // Find the closest timeline container on the page
    const timeline = document.querySelector(".service-timeline");
    if (!timeline) return;

    const tabs = Array.from(timeline.querySelectorAll(".process-step-btn"));
    const titleEl = timeline.querySelector("[data-title]");
    const bodyEl = timeline.querySelector("[data-body]");
    const panelEl = timeline.querySelector("#step-panel");

    // If the page doesn't have the timeline, do nothing (safe on any page).
    if (!tabs.length || !titleEl || !bodyEl || !panelEl) return;

    function setActive(stepKey) {
      const step = steps[stepKey];
      if (!step) return;

      let activeBtn = null;

      tabs.forEach((btn) => {
        const isActive = btn.dataset.step === stepKey;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");

        // Optional but nice: keep tab focus behavior consistent
        btn.setAttribute("tabindex", isActive ? "0" : "-1");

        if (isActive) activeBtn = btn;
      });

      // Tie the panel to the active tab for screen readers
      if (activeBtn && activeBtn.id) {
        panelEl.setAttribute("aria-labelledby", activeBtn.id);
      }

      titleEl.textContent = step.title;
      bodyEl.innerHTML = step.body;
    }

    function moveFocus(direction) {
      const currentIndex = tabs.findIndex((b) => b.classList.contains("is-active"));
      const idx = currentIndex >= 0 ? currentIndex : 0;

      const nextIndex =
        direction === "next"
          ? (idx + 1) % tabs.length
          : (idx - 1 + tabs.length) % tabs.length;

      const nextBtn = tabs[nextIndex];
      setActive(nextBtn.dataset.step);
      nextBtn.focus();
    }

    tabs.forEach((btn) => {
      btn.addEventListener("click", () => setActive(btn.dataset.step));

      // Keyboard support: Left/Right arrows (and Home/End)
      btn.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          moveFocus("next");
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          moveFocus("prev");
        } else if (e.key === "Home") {
          e.preventDefault();
          setActive(tabs[0].dataset.step);
          tabs[0].focus();
        } else if (e.key === "End") {
          e.preventDefault();
          setActive(tabs[tabs.length - 1].dataset.step);
          tabs[tabs.length - 1].focus();
        }
      });
    });

    // Initialize
    setActive(defaultStepKey || tabs[0]?.dataset.step);
  }

  // Expose one global initializer (intentionally small surface area)
  window.TREG = window.TREG || {};
  window.TREG.initProcessTimeline = initProcessTimeline;
})();
