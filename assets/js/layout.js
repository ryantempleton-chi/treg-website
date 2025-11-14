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
