function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const isHidden = sidebar.classList.contains("hidden");

  if (isHidden) {
    sidebar.classList.remove("hidden");
    setTimeout(() => {
      sidebar.classList.remove("-translate-x-full");
      overlay.classList.remove("hidden");
    }, 10); // Small delay to allow `hidden` class to be removed first
  } else {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
    setTimeout(() => {
      sidebar.classList.add("hidden");
    }, 300); // Match transition duration
  }
};

document
  .getElementById("languageMenuButton")
  .addEventListener("click", function () {
    var menu = document.querySelector(".origin-top-right");
    menu.classList.toggle("hidden");
  });
function openModal() {
  document.getElementById("searchModal").style.display = "block";
}

function closeModal() {
  document.getElementById("searchModal").style.display = "none";
}

// Close the modal when the user clicks anywhere outside of it
window.onclick = function (event) {
  const modal = document.getElementById("searchModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
};
        /* Set the language attribute on the HTML element based on the subpath of the URL
        This script will set the language attribute on the HTML element based on the subpath of the URL
        */
        document.addEventListener('DOMContentLoaded', function () {
            var path = window.location.pathname.split('/')[1]; // Get the first subpath
            var lang = 'en'; // Default language

            // Map subpaths to locales
            var localeMap = {
                'es': 'es',
                'br': 'pt',
                'en': 'en',
                // Add more mappings as needed
            };

            if (localeMap.hasOwnProperty(path)) {
                lang = localeMap[path];
            }

            document.querySelector('html').setAttribute('lang', lang);
        });
