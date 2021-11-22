window.addEventListener("DOMContentLoaded", () => {
  const blurhash = document.querySelector("blurhash-img");
  blurhash.setAttribute(
    "style",
    `--aspect-ratio: ${$("header").height() / $(document).width()};`
  );
});

window.addEventListener("load", () => {
  const blurhash = document.querySelector("blurhash-img");
  blurhash.style.opacity = 0;
  setTimeout(() => {
    blurhash.parentElement.removeChild(blurhash);
  }, 1000);
});
