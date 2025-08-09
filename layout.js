function loadLayoutPart(id, file) {
  fetch(file)
    .then(response => response.text())
    .then(data => {
      document.getElementById(id).innerHTML = data;
    })
    .catch(error => console.error('Error loading layout:', error));
}

// Load header & footer
document.addEventListener("DOMContentLoaded", () => {
  loadLayoutPart("site-header", "header.html");
  loadLayoutPart("site-footer", "footer.html");
});
