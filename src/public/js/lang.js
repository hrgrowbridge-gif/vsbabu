(function () {
  var STORAGE_KEY = "vsbabu_lang";
  var DEFAULT = "en";

  function apply(lang) {
    document.documentElement.lang = lang === "ta" ? "ta" : "en";

    document.querySelectorAll("[data-en]").forEach(function (el) {
      var val = el.getAttribute("data-" + lang);
      if (val) el.textContent = val;
    });

    document.querySelectorAll("[data-placeholder-en]").forEach(function (el) {
      var val = el.getAttribute("data-placeholder-" + lang);
      if (val) el.placeholder = val;
    });

    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.classList.toggle("lang-active", btn.dataset.lang === lang);
    });

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
  }

  document.addEventListener("DOMContentLoaded", function () {
    var saved;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}
    apply(saved || DEFAULT);

    document.addEventListener("click", function (e) {
      if (e.target.classList.contains("lang-btn")) {
        apply(e.target.dataset.lang);
      }
    });
  });
})();
