import reframe from "./lib/reframe.js";

/* Responsive HTML table */
(function () {
  const tables = document.querySelectorAll("div > table, section > table");

  tables.forEach(function (table) {
    const wrapper = document.createElement("div");
    wrapper.className = "table-responsive";
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
})();

/* Open external links in new tab */
const domain = window.location.host.replace(/^www\./i, "");
const links = document.querySelectorAll("a[href]");

links.forEach((link) => {
  try {
    const href = link.href.toLowerCase();
    // Skip empty links or potentially malicious javascript: URLs
    if (!href || /^javascript:/i.test(href)) return;

    // Check if link is external
    if (!href.includes(domain) || href.includes(`ref=${domain}`)) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener");
    }
  } catch (error) {
    console.warn("Error processing link:", error);
  }
});

/* Ghost search */
document.addEventListener("keydown", function (e) {
  // Check if user is not typing in an input/textarea
  if (
    e.key === "/" &&
    !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
  ) {
    const searchTrigger = document.querySelector("[data-ghost-search]");
    if (!searchTrigger) return;
    e.preventDefault();
    // Trigger Ghost search
    searchTrigger.click();
  }
});

/* Responsive video in post content */
(function () {
  const sources = [
    'figure iframe[src*="youtube.com"]',
    'figure iframe[src*="youtube-nocookie.com"]',
    'figure iframe[src*="player.vimeo.com"]',
    'figure iframe[src*="kickstarter.com"][src*="video.html"]',
    "figure object",
    "figure embed",
  ];
  reframe(document.querySelectorAll(sources.join(",")));
})();
