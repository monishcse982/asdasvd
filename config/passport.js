import Strategy from "passport-local";
import passport from "passport";
import mongoose from "mongoose";
let Admins = mongoose.model("Admin");

passport.use(
  new Strategy(
    {
      usernameField: "adminName",
      passwordField: "password",
    },
    function (username, password, done) {
      Admins.findOne({ adminName: username }, function (err, admin) {
        if (err) {
          return done(err);
        }
        if (!admin) {
          return done(null, false, { massage: "Incorrect username" });
        }
        if (!admin.validatePassword(password)) {
          return done(null, false, { massage: "Incorrect password" });
        }
        return done(null, admin);
      });
    }
  )
);
