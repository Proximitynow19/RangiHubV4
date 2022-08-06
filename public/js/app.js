window.addEventListener("DOMContentLoaded", () => {
  const blurhash = document.querySelector("blurhash-img");
  blurhash.setAttribute(
    "style",
    `--aspect-ratio: ${
      document.getElementById("background").offsetHeight /
      document.getElementById("background").offsetWidth
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

$("#loginForm").on("submit", async (e) => {
  displaySpinner(true, "Logging in");

  e.preventDefault();

  try {
    let user = await $.post(`/auth/login`, $("#loginForm").serialize());

    console.log(`Successfully logged in as ${user.data.studentInfo.KnownAs}`);

    displaySpinner(true, "Connecting to server");

    let socket = io();

    socket.on("connect", () => {
      displaySpinner(false);
    });
  } catch (err) {
    console.log(err.responseJSON);

    displaySpinner(false);

    $("#loginScreen").removeClass("hidden");
  }
});

function displaySpinner(visible, message) {
  if (visible) {
    $("#appBack > *").addClass("hidden");
    $("#spinner").removeClass("hidden");
    if (message) {
      $("#spinnerMessage").text(message);
      $("#spinnerMessage").removeClass("hidden");

      console.log(message);
    } else {
      $("#spinnerMessage").addClass("hidden");
    }
  } else {
    $("#spinner").addClass("hidden");
  }
}
