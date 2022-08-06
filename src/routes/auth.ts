import { Router } from "express";
const router = Router();
import passport from "passport";
import { io } from "../index";

router.get("/me", (req, res) => {
  const isAuthenticated = !!req.user;

  if (isAuthenticated)
    return res.status(200).json({ code: 200, data: req.user, success: true });

  return res
    .status(401)
    .json({ code: 401, data: "You are not logged in.", success: false });
});

router.post("/login", function (req, res, next) {
  passport.authenticate("LocalStrategy", function (err, user) {
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
  const socketId = req.session.socketId;

  if (socketId && io.of("/").sockets.get(socketId)) {
    io.of("/").sockets.get(socketId)?.disconnect(true);
  }

  req.logout();
  res.cookie("connect.sid", "", { expires: new Date() });
  res.redirect("/");
});

passport.serializeUser((user: any, cb) => {
  cb(null, user);
});

passport.deserializeUser((user: any, cb) => {
  cb(null, user);
});

export = router;
