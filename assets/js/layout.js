function loadFragment(targetId, url) {
  fetch(url)
    .then(function (response) {
      return response.text();
    })
    .then(function (html) {
      var el = document.getElementById(targetId);
      if (el) {
        el.innerHTML = html;
      }
    })
    .catch(function (err) {
      console.error("Error loading fragment:", url, err);
    });
}

document.addEventListener("DOMContentLoaded", function () {
  // Load shared header + footer
  loadFragment("site-header", "/partials/header.html");
  loadFragment("site-footer", "/partials/footer.html");

  // Update the year in the footer
  var yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
