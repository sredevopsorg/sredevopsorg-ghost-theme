
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("hidden");
};

document
  .getElementById("languageMenuButton")
  .addEventListener("click", function () {
    var menu = document.querySelector(".origin-top-right");
    menu.classList.toggle("hidden");
  });
