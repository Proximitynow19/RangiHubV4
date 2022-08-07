let user, socket;

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
    $(".vp").addClass("hidden");
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
    $(".vp").removeClass("hidden");
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

    $(".title").text(title);
    $("title").text(`${title} - RangiHub`);

    $("#viewport").html(html);

    await loadPageData();
  } catch (err) {
    errorMessage(
      "Page not found",
      "We had trouble loading the page requested."
    );

    await gotoPage("home");
  }

  displaySpinner(false);
}

async function loadPageData() {
  const pageInfo = window.location.href.split(/\/app\//g)[1].split(/\//g);

  if (pageInfo[0] !== "login") {
    if (!user) {
      errorMessage(
        "Not logged in",
        "You need to be logged in to view this page."
      );

      return gotoPage("login/" + pageInfo.join("/"));
    }
  }

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

          await new Promise(connectToServer);

          if (pageInfo[1]) return await gotoPage(pageInfo.slice(1).join("/"));

          return await gotoPage("home");
        } catch (err) {
          errorMessage(err.responseJSON.code, err.responseJSON.data);

          displaySpinner(false);
        }
      });
  }
}

function errorMessage(errTitle, errDesc) {
  console.log(errTitle, errDesc);
}

(async () => {
  try {
    user = (await $.get("/auth/me")).data;

    await new Promise(connectToServer);
  } catch (err) {
    console.log("Cannot fetch current user.");
  }

  renderPage();
})();

function noticeMessage(noticeTitle, noticeDesc) {
  console.log(noticeTitle, noticeDesc);
}

function connectToServer(resolve, _) {
  if (socket) {
    if (socket.connected) return resolve();

    socket.connect();
  } else {
    socket = io();
  }

  let fired = false;

  displaySpinner(true, "Connecting to server");

  socket.on("connect", async () => {
    displaySpinner(false);

    noticeMessage(
      "Connected to server",
      "You are now connected to the server."
    );

    if (!fired) {
      fired = true;

      resolve();
    }
  });

  socket.io.on("reconnect", () => {
    noticeMessage("Reconnected", "You have been reconnected to the server.");
  });

  socket.io.on("reconnection_attempt", () => {
    displaySpinner(true, "Attempting to reconnect");
  });

  socket.on("connect_error", () => {
    errorMessage(
      "Connection error",
      "We had trouble connecting to the server."
    );

    displaySpinner(true, "Attempting to reconnect");

    setTimeout(() => {
      socket.connect();
    }, 1000);
  });

  socket.on("disconnect", () => {
    noticeMessage(
      "Disconnected",
      "You have been disconnected from the server."
    );
  });
}
