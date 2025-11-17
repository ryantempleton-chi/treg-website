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
  // Load header first
  loadFragment("site-header", "/partials/header.html");

  // Load footer, then update the year AFTER it's ready
  loadFragment("site-footer", "/partials/footer.html", function () {
    var yearSpan = document.getElementById("year");
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }
  });
});
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".highlights-carousel").forEach((carousel) => {
    const track = carousel.querySelector(".highlights-track");
    if (!track) return;

    const cards = track.querySelectorAll(".highlight-card");
    if (!cards.length) return;

    const prevBtn = carousel.querySelector(".highlights-nav--prev");
    const nextBtn = carousel.querySelector(".highlights-nav--next");

    const getStep = () => {
      const first = cards[0].getBoundingClientRect();
      return first.width + 16; // approx. the gap
    };

    prevBtn && prevBtn.addEventListener("click", () => {
      track.scrollBy({ left: -getStep(), behavior: "smooth" });
    });

    nextBtn && nextBtn.addEventListener("click", () => {
      track.scrollBy({ left: getStep(), behavior: "smooth" });
    });
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const carousels = document.querySelectorAll(".highlights-carousel");
  if (!carousels.length) return;

  const AUTOPLAY_DELAY = 6000; // ms

  carousels.forEach((carousel) => {
    const track = carousel.querySelector(".highlights-track");
    const windowEl = carousel.querySelector(".highlights-window") || track.parentElement;
    const prevButton = carousel.querySelector(".highlights-nav--prev");
    const nextButton = carousel.querySelector(".highlights-nav--next");

    if (!track || !prevButton || !nextButton) return;

    let slides = Array.from(track.children);
    if (slides.length <= 1) return; // no need for carousel

    // ---- 1. Clone slides for infinite loop ----
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);
    firstClone.classList.add("clone");
    lastClone.classList.add("clone");

    track.insertBefore(lastClone, slides[0]);
    track.appendChild(firstClone);

    const allSlides = Array.from(track.children);
    const realSlideCount = slides.length;

    // ---- 2. Create dots / indicators ----
    let dotsWrapper = carousel.querySelector(".highlights-dots");
    if (!dotsWrapper) {
      dotsWrapper = document.createElement("div");
      dotsWrapper.className = "highlights-dots";
      carousel.appendChild(dotsWrapper);
    }

    dotsWrapper.innerHTML = "";
    const dots = [];
    for (let i = 0; i < realSlideCount; i++) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "highlights-dot";
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dotsWrapper.appendChild(dot);
      dots.push(dot);
    }

    let index = 1; // start on first "real" slide (after lastClone)
    let slideWidth = 0;
    let isAnimating = false;

    // ---- 3. Measure & position ----
    function measure() {
      slideWidth = windowEl.getBoundingClientRect().width;
      track.style.transition = "none";
      track.style.transform = `translateX(${-slideWidth * index}px)`;
      requestAnimationFrame(() => {
        // allow browser to apply transform before allowing transitions again
        track.style.transition = "";
      });
    }

    measure();
    window.addEventListener("resize", () => {
      measure();
    });

    function setActiveDot() {
      const realIndex = (index - 1 + realSlideCount) % realSlideCount; // 0-based
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === realIndex);
      });
    }
    setActiveDot();

    // ---- 4. Core movement helpers ----
    function goToIndex(newIndex) {
      if (isAnimating) return;
      isAnimating = true;
      index = newIndex;
      track.style.transition = "transform 0.4s ease";
      track.style.transform = `translateX(${-slideWidth * index}px)`;
    }

    function goToNext() {
      if (isAnimating) return;
      goToIndex(index + 1);
    }

    function goToPrev() {
      if (isAnimating) return;
      goToIndex(index - 1);
    }

    track.addEventListener("transitionend", () => {
      // If we’re on a clone, snap back to the corresponding real slide
      if (allSlides[index].classList.contains("clone")) {
        track.style.transition = "none";
        if (index === allSlides.length - 1) {
          // at the cloned first slide, snap to real first
          index = 1;
        } else if (index === 0) {
          // at the cloned last slide, snap to real last
          index = allSlides.length - 2;
        }
        track.style.transform = `translateX(${-slideWidth * index}px)`;
      }

      setActiveDot();
      // Small timeout so quick double-clicks don’t break things
      setTimeout(() => {
        isAnimating = false;
      }, 20);
    });

    // ---- 5. Buttons ----
    nextButton.addEventListener("click", () => {
      stopAutoplay();
      goToNext();
    });

    prevButton.addEventListener("click", () => {
      stopAutoplay();
      goToPrev();
    });

    // ---- 6. Dots click ----
    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        stopAutoplay();
        // real slide i corresponds to index i + 1 (because of leading clone)
        goToIndex(i + 1);
      });
    });

    // ---- 7. Autoplay ----
    let autoplayId = null;

    function startAutoplay() {
      if (AUTOPLAY_DELAY <= 0 || autoplayId) return;
      autoplayId = setInterval(() => {
        if (!document.hidden) {
          goToNext();
        }
      }, AUTOPLAY_DELAY);
    }

    function stopAutoplay() {
      if (!autoplayId) return;
      clearInterval(autoplayId);
      autoplayId = null;
    }

    // Pause on hover / focus
    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);

    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", startAutoplay);

    startAutoplay();

    // ---- 8. Swipe / drag (desktop + mobile) ----
    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let dragStartIndex = index;

    function getEventClientX(e) {
      if (e.type.startsWith("touch")) {
        return e.touches[0].clientX;
      }
      return e.clientX;
    }

    function pointerDown(e) {
      stopAutoplay();
      isDragging = true;
      track.style.transition = "none";
      startX = getEventClientX(e);
      dragStartIndex = index;
      prevTranslate = -slideWidth * index;
      currentTranslate = prevTranslate;

      window.addEventListener("mousemove", pointerMove);
      window.addEventListener("mouseup", pointerUp);
      window.addEventListener("touchmove", pointerMove, { passive: false });
      window.addEventListener("touchend", pointerUp);
    }

    function pointerMove(e) {
      if (!isDragging) return;
      if (e.type === "touchmove") e.preventDefault(); // prevent page scroll while swiping

      const currentX = getEventClientX(e);
      const deltaX = currentX - startX;
      currentTranslate = prevTranslate + deltaX;
      track.style.transform = `translateX(${currentTranslate}px)`;
    }

    function pointerUp(e) {
      if (!isDragging) return;
      isDragging = false;

      const endX = getEventClientX(e);
      const deltaX = endX - startX;
      const threshold = slideWidth * 0.25;

      track.style.transition = "transform 0.4s ease";

      if (deltaX < -threshold) {
        // swipe left => next
        goToNext();
      } else if (deltaX > threshold) {
        // swipe right => prev
        goToPrev();
      } else {
        // snap back
        track.style.transform = `translateX(${-slideWidth * index}px)`;
      }

      window.removeEventListener("mousemove", pointerMove);
      window.removeEventListener("mouseup", pointerUp);
      window.removeEventListener("touchmove", pointerMove);
      window.removeEventListener("touchend", pointerUp);
      startAutoplay();
    }

    windowEl.addEventListener("mousedown", pointerDown);
    windowEl.addEventListener("touchstart", pointerDown, { passive: true });
  });
});

