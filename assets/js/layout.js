/* =========================================================
   layout.js — TREG
   - Loads header/footer partials
   - Updates footer year
   - Neighborhood highlights carousel (robust, multi-card, infinite loop)
   ========================================================= */

/* =============================
   Load header / footer partials
   ============================= */
function loadFragment(targetId, url, callback) {
  fetch(url)
    .then((response) => response.text())
    .then((html) => {
      const el = document.getElementById(targetId);
      if (el) el.innerHTML = html;
      if (callback) callback();
    })
    .catch((err) => {
      console.error("Error loading fragment:", url, err);
    });
}

function initPartials() {
  // Header
  loadFragment("site-header", "/partials/header.html");

  // Footer + year
  loadFragment("site-footer", "/partials/footer.html", () => {
    const yearSpan = document.getElementById("year");
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
  });
}

/* ============================================
   Neighborhood highlights carousel (robust)
   - shows multiple cards at once
   - arrows move ONE CARD at a time
   - infinite loop (wraps around)
   - safe against double-init
   ============================================ */
function initHighlightsCarousels() {
  const carousels = document.querySelectorAll(".highlights-carousel");
  if (!carousels.length) return;

  carousels.forEach((carousel) => {
    if (carousel.dataset.carouselInit === "1") return;
    carousel.dataset.carouselInit = "1";
    setupCarousel(carousel);
  });

  function setupCarousel(carousel) {
    const windowEl = carousel.querySelector(".highlights-window");
    const track = carousel.querySelector(".highlights-track");
    const prevBtn = carousel.querySelector(".highlights-nav--prev");
    const nextBtn = carousel.querySelector(".highlights-nav--next");

    if (!windowEl || !track || !prevBtn || !nextBtn) return;

    // Prevent cloning twice
    if (track.dataset.cloned === "1") return;
    track.dataset.cloned = "1";

    const originalSlides = Array.from(track.children);
    const realCount = originalSlides.length;
    if (realCount <= 1) return;

    // ---- 1) Clone first & last for infinite loop ----
    const firstClone = originalSlides[0].cloneNode(true);
    const lastClone = originalSlides[realCount - 1].cloneNode(true);
    firstClone.classList.add("clone");
    lastClone.classList.add("clone");

    track.insertBefore(lastClone, originalSlides[0]);
    track.appendChild(firstClone);

    const getSlides = () => Array.from(track.children);

    // ---- 2) Measure stride (card width + CSS gap) ----
    function getGapPx() {
      const styles = getComputedStyle(track);
      const gap = styles.gap || styles.columnGap || "0px";
      return parseFloat(gap) || 0;
    }

    function getStride() {
      const slides = getSlides();
      const firstReal = slides[1] || slides[0];
      const cardWidth = firstReal
        ? firstReal.getBoundingClientRect().width
        : windowEl.getBoundingClientRect().width;

      return cardWidth + getGapPx();
    }

    let stride = getStride();
    let index = 1; // start on first REAL slide
    let isAnimating = false;

    // ---- 3) Dots ----
    let dotsWrapper = carousel.querySelector(".highlights-dots");
    if (!dotsWrapper) {
      dotsWrapper = document.createElement("div");
      dotsWrapper.className = "highlights-dots";
      carousel.appendChild(dotsWrapper);
    } else {
      dotsWrapper.innerHTML = "";
    }

    const dots = [];
    for (let i = 0; i < realCount; i++) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "highlights-dot";
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dotsWrapper.appendChild(dot);
      dots.push(dot);

      dot.addEventListener("click", () => goTo(i + 1)); // +1 offset (because of leading clone)
    }

    function updateDots() {
      const realIndex = (index - 1 + realCount) % realCount;
      dots.forEach((d, i) => d.classList.toggle("is-active", i === realIndex));
    }

    // ---- 4) Move helpers ----
    function setTransform(newIndex, withAnimation = true) {
      track.style.transition = withAnimation ? "transform 0.35s ease" : "none";
      track.style.transform = `translateX(${-stride * newIndex}px)`;

      if (!withAnimation) {
        track.getBoundingClientRect(); // force reflow
        track.style.transition = "transform 0.35s ease";
      }
    }

    function goTo(newIndex) {
      if (isAnimating) return;
      isAnimating = true;

      index = newIndex;
      setTransform(index, true);
      updateDots();
    }

    function goNext() {
      goTo(index + 1);
    }

    function goPrev() {
      goTo(index - 1);
    }

    // Initial position
    setTransform(index, false);
    updateDots();

    // ---- 5) Infinite loop snap ----
    track.addEventListener("transitionend", () => {
      const slides = getSlides();
      const current = slides[index];

      if (current && current.classList.contains("clone")) {
        // if we're on a clone, snap to real slide without animation
        if (index === 0) index = realCount; // real last
        if (index === slides.length - 1) index = 1; // real first
        setTransform(index, false);
        updateDots();
      }

      isAnimating = false;
    });

    // ---- 6) Buttons ----
    nextBtn.addEventListener("click", goNext);
    prevBtn.addEventListener("click", goPrev);

    // ---- 7) Re-measure on resize + after images load ----
    function recalc() {
      stride = getStride();
      setTransform(index, false);
    }

    window.addEventListener("resize", recalc);

    // Recalc after images load (image heights can affect layout/widths)
    const imgs = carousel.querySelectorAll("img");
    let pending = 0;

    imgs.forEach((img) => {
      if (img.complete) return;
      pending++;
      img.addEventListener("load", () => {
        pending--;
        if (pending === 0) recalc();
      });
    });

    // Extra settle tick (fonts/layout)
    requestAnimationFrame(() => requestAnimationFrame(recalc));
  }
}

/* =============================
   Boot
   ============================= */
document.addEventListener("DOMContentLoaded", () => {
  initPartials();
  initHighlightsCarousels();
});
