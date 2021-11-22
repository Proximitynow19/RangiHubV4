"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const dotenv_1 = require("dotenv");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const express_session_1 = __importDefault(require("express-session"));
const body_parser_1 = __importDefault(require("body-parser"));
const passport_1 = __importDefault(require("passport"));
const nanoid_1 = require("nanoid");
const local_1 = __importDefault(require("./strategies/local"));
const path_1 = require("path");
const node_fetch_1 = __importDefault(require("node-fetch"));
const config_json_1 = require("./config.json");
(0, dotenv_1.config)();
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
const app = (0, express_1.default)();
app.set("view engine", "ejs");
app.set("views", (0, path_1.join)(__dirname, "../views"));
const server = http_1.default.createServer(app);
const port = process.env.PORT || 8000;
const sessionMiddleware = (0, express_session_1.default)({
    secret: (0, nanoid_1.nanoid)(32),
    resave: false,
    saveUninitialized: false,
});
app.use(sessionMiddleware);
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
passport_1.default.use("LocalStrategy", local_1.default);
app.use("/public", express_1.default.static((0, path_1.join)(__dirname, "../public")));
app.use("/auth", require("./routes/auth"));
function getUnsplashBackground() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const background = yield (yield (0, node_fetch_1.default)("https://api.unsplash.com/photos/random?query=new%20zealand&orientation=landscape", {
                method: "GET",
                headers: {
                    Authorization: `Authorization: Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
                },
            })).json();
            return {
                image: background.urls.raw,
                author: background.user.name,
                authorUrl: background.user.links.html,
                blurHash: background.blur_hash,
            };
        }
        catch (_a) {
            return config_json_1.unsplashFallback;
        }
    });
}
app.get("/", (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render("index", yield getUnsplashBackground());
}));
app.get(/\/app(\/.*)?/, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.path.split(/\//g).length - 1 <= 1) {
        if (!!req.user) {
            res.redirect("/app/home");
        }
        else {
            res.redirect("/app/login");
        }
        return;
    }
    res.render("app", yield getUnsplashBackground());
}));
const socket_io_1 = require("socket.io");
exports.io = new socket_io_1.Server(server);
const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);
exports.io.use(wrap(sessionMiddleware));
exports.io.use(wrap(passport_1.default.initialize()));
exports.io.use(wrap(passport_1.default.session()));
exports.io.use((socket, next) => {
    if (socket.request.user) {
        next();
    }
    else {
        next(new Error("unauthorized"));
    }
});
exports.io.on("connect", (socket) => {
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
