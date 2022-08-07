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
    console.log(err);

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

    $(".userSet").each(function () {
      let val = user;

      $(this)
        .data("prop")
        .split(/\./g)
        .forEach((element) => {
          val = val[element];

          $(this).text(val);
        });
    });
  }

  switch (pageInfo[0]) {
    case "login":
      if (user) return gotoPage("home");
      $("#loginForm").on("submit", async (e) => {
        displaySpinner(true, "Logging in");

        e.preventDefault();

        try {
          user = (await $.post(`/auth/login`, $("#loginForm").serialize()))
            .data;

          noticeMessage(
            `Welcome back, ${user.studentInfo.KnownAs}!`,
            "You have been logged in."
          );

          await new Promise(connectToServer);

          if (pageInfo[1]) return await gotoPage(pageInfo.slice(1).join("/"));

          return await gotoPage("home");
        } catch (err) {
          errorMessage(err.responseJSON.code, err.responseJSON.data);

          displaySpinner(false);
        }
      });
      break;
    case "home":
      let nextDay = user.timetable.find(
        (k) =>
          new Date(
            `${k.Date.slice(0, -8)}${k.periodData
              .at(-1)
              .ToTime.replace(/\./g, ":")}`
          ).getTime() > Date.now()
      );

      let periods = nextDay.periodData.filter(
        (k) =>
          new Date(
            `${nextDay.Date.slice(0, -8)}${k.ToTime.replace(/\./g, ":")}`
          ).getTime() > Date.now()
      );

      const listClasses = periods.length;

      for (var i = 0; i < listClasses; i++) {
        $("#upcoming").html(
          `${$("#upcoming").html()}<div><span class="className">${
            periods[i].teacherTimeTable.Desc
          }</span><span class="classTime">${
            new Date(
              `${nextDay.Date.slice(0, -8)}${periods[i].FromTime.replace(
                /\./g,
                ":"
              )}`
            ).getTime() > Date.now()
              ? periods[i].FromTime.replace(/\./g, ":")
              : periods[i].ToTime.replace(/\./g, ":")
          }</span></div>`
        );
      }
      break;
  }
}

function errorMessage(errTitle, errDesc) {
  console.log(errTitle, errDesc);

  $("#notices").html(
    `${$(
      "#notices"
    ).html()}<div class="err"><strong>${errTitle}</strong><span>${errDesc}</span></div>`
  );

  setTimeout(() => {
    $("#notices > div").first().remove();
  }, 5000);
}

(async () => {
  try {
    user = (await $.get("/auth/me")).data;

    noticeMessage(
      `Welcome back, ${user.studentInfo.KnownAs}!`,
      "You have been logged in."
    );

    await new Promise(connectToServer);
  } catch (err) {
    console.log("Cannot fetch current user.");
  }

  renderPage();
})();

function noticeMessage(noticeTitle, noticeDesc) {
  console.log(noticeTitle, noticeDesc);

  $("#notices").html(
    `${$(
      "#notices"
    ).html()}<div class="notice"><strong>${noticeTitle}</strong><span>${noticeDesc}</span></div>`
  );

  setTimeout(() => {
    $("#notices > div").first().remove();
  }, 5000);
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
    displaySpinner(true, "Disconnected from server");

    noticeMessage(
      "Disconnected",
      "You have been disconnected from the server."
    );
  });
}

window.addEventListener(
  "popstate",
  async function () {
    await renderPage();
  },
  false
);

async function logout() {
  await $.post("/auth/logout");

  user = null;

  await socket.disconnect();

  socket = null;

  await gotoPage(
    "login/" +
      window.location.href
        .split(/\/app\//g)[1]
        .split(/\//g)
        .join("/")
  );
}
