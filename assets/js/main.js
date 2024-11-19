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

/* Responsive HTML table */
(function () {
    const tables = document.querySelectorAll('section > table');
    
    tables.forEach(function (table) {
        const wrapper = document.createElement('div');
        wrapper.className = 'hay-tabla';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
})();

/* Open external links in new tab */
const domain = window.location.host.replace(/^www\./i, '');
const links = document.querySelectorAll('a[href]');

links.forEach((link) => {
    try {
        const href = link.href.toLowerCase();
        // Skip empty links or potentially malicious javascript: URLs
        if (!href || /^javascript:/i.test(href)) return;
        
        // Check if link is external
        if (!href.includes(domain) || href.includes(`ref=${domain}`)) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener');
        }
    } catch (error) {
        console.warn('Error processing link:', error);
    }
});

/* Ghost search */
document.addEventListener("keydown", function (e) {
  // Check if user is not typing in an input/textarea
  if (
    e.key === "/" &&
    !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
  ) {
    e.preventDefault();
    // Trigger Ghost search
    document.querySelector("[data-ghost-search]").click();
  }
});