// index.js
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});

console.log("Hand-built by Dane Beels — no AI, just HTML/CSS/JS.");