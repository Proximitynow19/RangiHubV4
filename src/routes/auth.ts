import { Router } from "express";
const router = Router();
import passport from "passport";
import { io } from "../index";
import User from "../models/User";
import sgMail from "@sendgrid/mail";
import fs from "fs";
import { join } from "path";

sgMail.setApiKey(process.env.SENDGRID_KEY as string);

router.get("/me", (req, res) => {
  const isAuthenticated = !!req.user;

  if (isAuthenticated)
    return res
      .status(200)
      .json({ code: 200, data: req.user.u_dat, success: true });

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

    req.logIn(user, async function (err) {
      if (err) {
        return res.status(500).json({ code: 500, data: err, success: false });
      }

      let document = await User.findOne({
        username: `${user.u_dat.studentInfo.StudentID}`,
      });

      if (!document) {
        try {
          document = new User({
            username: `${user.u_dat.studentInfo.StudentID}`,
            joined_at: new Date(),
          });

          document.save();

          sgMail.send({
            to: user.u_dat.studentInfo.Email,
            from: "noreply@rangi.xyz",
            subject: `Hello ${user.u_dat.studentInfo.KnownAs}, Welcome to RangiHub`,
            html: fs
              .readFileSync(join(__dirname, "../../welcome.html"), "utf8")
              .replace(/%n/g, user.u_dat.studentInfo.KnownAs)
              .replace(/%e/g, user.u_dat.studentInfo.Email),
          });
        } catch (err) {}
      }

      return res
        .status(200)
        .json({ code: 200, data: user.u_dat, success: true });
    });
  })(req, res, next);
});

router.post("/logout", (req, res) => {
  const isAuthenticated = !!req.user;

  if (!isAuthenticated)
    return res
      .status(401)
      .json({ code: 401, data: "You are not logged in.", success: false });

  const socketId = req.session.socketId;

  if (socketId && io.of("/").sockets.get(socketId)) {
    io.of("/").sockets.get(socketId)?.disconnect(true);
  }

  req.logout();

  res.status(200).json({ code: 200, data: null, success: true });
});

passport.serializeUser((user: any, cb) => {
  cb(null, user);
});

passport.deserializeUser((user: any, cb) => {
  cb(null, user);
});

export = router;
