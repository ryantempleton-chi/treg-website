// =============================
// Load header / footer partials
// =============================
function loadFragment(targetId, url, callback) {
  fetch(url)
    .then(function (response) {
      return response.text();
    })
    .then(function (html) {
      var el = document.getElementById(targetId);
      if (el) {
        el.innerHTML = html;
      }
      if (callback) callback();
    })
    .catch(function (err) {
      console.error("Error loading fragment:", url, err);
    });
}

document.addEventListener("DOMContentLoaded", function () {
  // Load header
  loadFragment("site-header", "/partials/header.html");

  // Load footer, then update the year AFTER it's ready
  loadFragment("site-footer", "/partials/footer.html", function () {
    var yearSpan = document.getElementById("year");
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }
  });
});

// =============================
// Neighborhood highlights carousel
// - shows multiple cards at once
// - arrows move ONE CARD at a time
// - works with 3 slides (Avondale) or 5+ (Bucktown)
// - infinite loop (wraps around)
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const carousels = document.querySelectorAll(".highlights-carousel");
  if (!carousels.length) return;

  carousels.forEach(setupCarousel);

  function setupCarousel(carousel) {
    const windowEl = carousel.querySelector(".highlights-window");
    const track = carousel.querySelector(".highlights-track");
    const prevBtn = carousel.querySelector(".highlights-nav--prev");
    const nextBtn = carousel.querySelector(".highlights-nav--next");

    if (!windowEl || !track || !prevBtn || !nextBtn) return;

    const originalSlides = Array.from(track.children);
    const realCount = originalSlides.length;
    if (realCount <= 1) return; // nothing to slide

    // ---- 1. Clone first & last slide for infinite loop ----
    const firstClone = originalSlides[0].cloneNode(true);
    const lastClone = originalSlides[realCount - 1].cloneNode(true);
    firstClone.classList.add("clone");
    lastClone.classList.add("clone");

    track.insertBefore(lastClone, originalSlides[0]);
    track.appendChild(firstClone);

    const allSlides = Array.from(track.children);

    // ---- 2. Measure "stride" (distance from one card to the next) ----
    function getStride() {
      if (allSlides.length < 2) {
        return windowEl.getBoundingClientRect().width;
      }
      const rect1 = allSlides[0].getBoundingClientRect();
      const rect2 = allSlides[1].getBoundingClientRect();
      return rect2.left - rect1.left; // includes the gap between cards
    }

    let stride = getStride();

    let index = 1;          // start on first REAL slide (after lastClone)
    let isAnimating = false;

    // ---- 3. Dots / indicators ----
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

      dot.addEventListener("click", () => {
        goTo(i + 1); // +1 because index 0 is the cloned last slide
      });
    }

    function updateDots() {
      const realIndex = (index - 1 + realCount) % realCount; // 0-based
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === realIndex);
      });
    }

    // ---- 4. Movement helpers ----
    function jumpWithoutAnimation(newIndex) {
      track.style.transition = "none";
      track.style.transform = `translateX(${-stride * newIndex}px)`;
      // force a reflow so the browser applies it immediately
      track.getBoundingClientRect();
      track.style.transition = "transform 0.35s ease";
    }

    function goTo(newIndex) {
      if (isAnimating) return;
      isAnimating = true;
      index = newIndex;
      track.style.transform = `translateX(${-stride * index}px)`;
      updateDots();
    }

    function goNext() {
      goTo(index + 1);
    }

    function goPrev() {
      goTo(index - 1);
    }

    // Start positioned on the first real slide
    jumpWithoutAnimation(index);
    updateDots();

    // ---- 5. Handle infinite loop snapping ----
    track.addEventListener("transitionend", () => {
      if (allSlides[index].classList.contains("clone")) {
        if (index === 0) {
          // we slid onto the cloned last slide -> snap to real last
          index = realCount;
        } else if (index === allSlides.length - 1) {
          // we slid onto the cloned first slide -> snap to real first
          index = 1;
        }
        jumpWithoutAnimation(index);
      }
      // allow the next animation
      setTimeout(() => {
        isAnimating = false;
      }, 20);
    });

    // ---- 6. Buttons ----
    nextBtn.addEventListener("click", goNext);
    prevBtn.addEventListener("click", goPrev);

    // ---- 7. Resize: recompute stride so cards stay aligned ----
    window.addEventListener("resize", () => {
      stride = getStride();
      jumpWithoutAnimation(index);
    });
  }
});
