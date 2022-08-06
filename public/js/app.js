let user = null;

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

function displaySpinner(visible, message) {
  if (visible) {
    $("#viewport").addClass("hidden");
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
    $("#viewport").removeClass("hidden");
  }
}

async function gotoPage(page) {
  history.pushState(null, null, `/app/${page}`);

  await renderPage();
}

async function renderPage() {
  displaySpinner(true);

  try {
    const page = window.location.href.split(/\/app\//g)[1].split(/\//g)[0];

    const file = await $.get(`/public/pages/${page}.html`);

    const content = file.split("\n");
    const title = content.shift();
    const html = content.join("\n");

    $("title").text(`${title} - RangiHub`);

    $("#viewport").html(html);

    await loadPageData();
  } catch (err) {
    await gotoPage("home");
  }

  displaySpinner(false);
}

async function loadPageData() {
  const pageInfo = window.location.href.split(/\/app\//g)[1].split(/\//g);

  switch (pageInfo[0]) {
    case "login":
      if (user) return gotoPage("home");

      $("#loginForm").on("submit", async (e) => {
        displaySpinner(true, "Logging in");

        e.preventDefault();

        try {
          user = await $.post(`/auth/login`, $("#loginForm").serialize());

          console.log(
            `Successfully logged in as ${user.data.studentInfo.KnownAs}`
          );

          displaySpinner(true, "Connecting to server");

          let socket = io();

          socket.on("connect", async () => {
            await gotoPage("home");
          });
        } catch (err) {
          console.log(err.responseJSON);

          displaySpinner(false);
        }
      });
  }
}

function errorMessage(errTitle, errDesc) {}

(async () => {
  try {
    user = (await $.get("/auth/me")).data;
  } catch (err) {
    console.log("Cannot fetch current user.");
  }

  renderPage();
})();
