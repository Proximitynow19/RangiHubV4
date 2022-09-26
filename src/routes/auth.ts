import { Router } from "express";
const router = Router();
import passport from "passport";
import { io } from "../index";
import User from "../models/User";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_KEY as string);

router.get("/me", (req, res) => {
  const isAuthenticated = !!req.user;

  if (isAuthenticated)
    return res
      .status(200)
      .json({ code: 200, data: req.user.info, success: true });

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
        username: `${user.info.id}`,
      });

      if (!document) {
        try {
          document = new User({
            username: `${user.info.id}`,
            joined_at: new Date(),
          });

          document.save();

          sgMail.send({
            to: user.info.email,
            from: "noreply@rangi.xyz",
            templateId: "d-f98e0837b96946539211c42b945b2c2d",
            dynamicTemplateData: { name: user.info.name },
          });
        } catch (err) {}
      }

      return res
        .status(200)
        .json({ code: 200, data: user.info, success: true });
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
