window.addEventListener("DOMContentLoaded", () => {
  const blurhash = document.querySelector("blurhash-img");
  blurhash.setAttribute(
    "style",
    `--aspect-ratio: ${
      document.getElementsByTagName("header")[0].offsetHeight /
      document.getElementsByTagName("header")[0].offsetWidth
    };`
  );
});

window.addEventListener("load", () => {
  const blurhash = document.querySelector("blurhash-img");
  blurhash.style.opacity = 0;
  setTimeout(() => {
    blurhash.parentElement.removeChild(blurhash);
  }, 1000);
});

window.addEventListener("scroll", () => {
  const dynamicNav = document.getElementById("dynamic-nav");

  if (
    window.scrollY > document.getElementsByTagName("header")[0].offsetHeight
  ) {
    if (dynamicNav.classList.contains("hidden"))
      dynamicNav.classList.remove("hidden");
  } else {
    if (!dynamicNav.classList.contains("hidden"))
      dynamicNav.classList.add("hidden");
  }
});
