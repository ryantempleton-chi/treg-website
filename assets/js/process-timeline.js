(function () {
  function initProcessTimeline(steps, defaultStepKey) {
    if (!steps) return;

    // Scope everything to THIS page's timeline
    const timeline = document.querySelector(".service-timeline");
    if (!timeline) return;

    const tabs = Array.from(timeline.querySelectorAll(".process-step-btn"));
    const titleEl = timeline.querySelector("[data-title]");
    const bodyEl = timeline.querySelector("[data-body]");

    // If the page doesn't have the timeline, do nothing (safe on any page).
    if (!tabs.length || !titleEl || !bodyEl) return;

    function setActive(stepKey) {
      const step = steps[stepKey];
      if (!step) return;

      tabs.forEach((btn) => {
        const isActive = btn.dataset.step === stepKey;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      titleEl.textContent = step.title;
      bodyEl.innerHTML = step.body;
    }

    tabs.forEach((btn) => {
      btn.addEventListener("click", () => setActive(btn.dataset.step));
    });

    setActive(defaultStepKey || tabs[0]?.dataset.step);
  }

  // Expose one global initializer (intentionally small surface area)
  window.TREG = window.TREG || {};
  window.TREG.initProcessTimeline = initProcessTimeline;
})();
