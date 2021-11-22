"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = require("express");
const router = (0, express_1.Router)();
const passport_1 = __importDefault(require("passport"));
const path_1 = require("path");
const index_1 = require("../index");
router.get("/", (req, res) => {
    const isAuthenticated = !!req.user;
    res.sendFile((0, path_1.join)(__dirname, "../../views", isAuthenticated ? "index.html" : "login.html"));
});
router.post("/login", function (req, res, next) {
    passport_1.default.authenticate("LocalStrategy", function (err, user) {
        if (err) {
            return res.status(err.code).json(err);
        }
        if (!user) {
            return res.status(500).json({
                code: 500,
                data: "Unexpected Error Occurred. Please Try Again Later.",
                success: false,
            });
        }
        req.logIn(user, function (err) {
            if (err) {
                return res.status(500).json({ code: 500, data: err, success: false });
            }
            return res.status(200).json({ code: 200, data: user, success: true });
        });
    })(req, res, next);
});
router.post("/logout", (req, res) => {
    var _a;
    const socketId = req.session.socketId;
    if (socketId && index_1.io.of("/").sockets.get(socketId)) {
        (_a = index_1.io.of("/").sockets.get(socketId)) === null || _a === void 0 ? void 0 : _a.disconnect(true);
    }
    req.logout();
    res.cookie("connect.sid", "", { expires: new Date() });
    res.redirect("/");
});
passport_1.default.serializeUser((user, cb) => {
    cb(null, user);
});
passport_1.default.deserializeUser((user, cb) => {
    cb(null, user);
});
module.exports = router;
