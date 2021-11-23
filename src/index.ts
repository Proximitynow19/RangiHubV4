import { config } from "dotenv";
import express from "express";
import http from "http";
import session from "express-session";
import bodyParser from "body-parser";
import passport from "passport";
import { nanoid } from "nanoid";
import localStrategy from "./strategies/local";
import { join } from "path";
import fetch from "node-fetch";
import { unsplashFallback } from "./config.json";

config();

console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

const app = express();

app.set("view engine", "ejs");
app.set("views", join(__dirname, "../views"));

declare module "http" {
  interface IncomingMessage {
    user: any;
    session: any;
  }
}

const server = http.createServer(app);
const port = process.env.PORT || 8000;

const sessionMiddleware = session({
  secret: nanoid(32),
  resave: false,
  saveUninitialized: false,
});

app.use(sessionMiddleware);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.use("LocalStrategy", localStrategy);

app.use("/public", express.static(join(__dirname, "../public")));
app.use("/auth", require("./routes/auth"));

async function getUnsplashBackground() {
  try {
    const background = await (
      await fetch(
        "https://api.unsplash.com/photos/random?query=new%20zealand&orientation=landscape",
        {
          method: "GET",
          headers: {
            Authorization: `Authorization: Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
          },
        }
      )
    ).json();

    return {
      image: background.urls.raw,
      author: background.user.name,
      authorUrl: background.user.links.html,
      blurHash: background.blur_hash,
    };
  } catch {
    return unsplashFallback;
  }
}

export let unsplashBackground = unsplashFallback;

app.get("/", async (_, res) => {
  res.render("index", unsplashBackground);
});

app.get(/\/app(\/.*)?/, async (req, res) => {
  if (req.path.split(/\//g).length - 1 <= 1) {
    if (!!req.user) {
      res.redirect("/app/home");
    } else {
      res.redirect("/app/login");
    }

    return;
  }

  res.render("app", unsplashBackground);
});

import { Server, Socket } from "socket.io";
export const io = new Server(server);

const wrap =
  (middleware: CallableFunction) => (socket: Socket, next: CallableFunction) =>
    middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

io.use((socket, next) => {
  if (socket.request.user) {
    next();
  } else {
    next(new Error("unauthorized"));
  }
});

io.on("connect", (socket) => {
  socket.on("whoami", (cb) => {
    cb(socket.request.user ? socket.request.user.username : "");
  });

  const session = socket.request.session;
  session.socketId = socket.id;
  session.save();
});

server.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});

(async () => {
  unsplashBackground = await getUnsplashBackground();

  setInterval(async () => {
    unsplashBackground = await getUnsplashBackground();
  }, 1000 * 60 * 60 * 24);
})();
