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
