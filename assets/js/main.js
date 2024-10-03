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
