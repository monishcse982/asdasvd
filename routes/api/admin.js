import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import bluebird from "bluebird";
import auth from "../auth.js";
import redisClient from "../../utils/redisConnect.js";
import logger from "../../utils/logger.js";
import { envs as ENVS } from "../../config.js";

mongoose.Promise = bluebird;

let adminRouter = express.Router();

// Models
let Admin = mongoose.model("Admin");

let roles = ["admin", "operator"];

let validateAdminSession = (adminId) => {
  return new Promise((resolve) => {
    redisClient.get(adminId, (err, value) => {
      if (err) {
        logger.error(err);
        resolve("error");
      } else if (value == null) {
        resolve(false);
      } else if (value != null) {
        resolve(true);
      }
    });
  });
};

let validateUserRole = (userId, role) => {
  return new Promise((resolve) => {
    Admin.findOne({ adminId: userId }, (err, admin) => {
      if (err) {
        logger.error(err);
        resolve("error");
      } else if (admin == null) {
        resolve("invalid");
      } else {
        resolve(admin.role.toString());
      }
    });
  });
};

// Login
adminRouter.post("/login", (req, res, next) => {
  if (!req.body.adminName || !req.body.password) {
    return res.status(422).json({ error: "can't be blank" });
  }
  passport.authenticate("local", { session: false }, (err, admin, info) => {
    if (err) {
      return next(err);
    }
    if (admin) {
      admin.token = admin.generateJWT();
      redisClient.setex(
        admin.adminId,
        parseInt(ENVS.SESSION_TIMEOUT_SECONDS),
        admin.token
      );
      logger.info("Login successful for : " + req.body.adminName);
      return res.json({ admin: admin.toAuthJson() });
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
});

// Logout
adminRouter.post("/logout", async (req, res) => {
  if (!req.body.adminId) {
    return res.status(422).json({ error: "AdminID can't be blank" });
  }
  const isSessionActive = await validateAdminSession(req.body.adminId);
  if (isSessionActive === "error") {
    return res
      .status(500)
      .json({ error: "Admin session closed due to server error" });
  }
  if (isSessionActive) {
    redisClient.del(req.body.adminId.toString(), (err) => {
      if (err) {
        logger.error(err.toString());
      } else {
        return res.status(200).json({ message: "Logout successful!" });
      }
    });
  } else {
    return res.status(400).json({ error: "Admin not logged in" });
  }
});

// Get one or all admins
adminRouter.get("/get", auth.required, async (req, res, next) => {
  const isSessionActive = await validateAdminSession(req.body.adminId);
  if (isSessionActive === "error") {
    return res
      .status(500)
      .json({ error: "Admin session closed due to server error" });
  } else if (!isSessionActive) {
    return res.status(400).json({ message: "Requester not logged in" });
  }

  let userId = req.body.adminId;

  if (userId === "all") {
    let adminDetails = [];
    Admin.find({}, (err, allAdmins) => {
      if (err) {
        logger.error(err.toString());
        next(err);
      }
      if (allAdmins == null) {
        return res.status(404).json({ message: "No admins found" });
      }
      for (let index = 0; index < allAdmins.length; index++) {
        adminDetails.push(allAdmins[index].toProfileJSON());
      }
      return res.status(200).json({ admins: adminDetails });
    });
  } else {
    Admin.findOne({ adminId: userId }, (err, admin) => {
      if (err) {
        next(err);
      }
      if (admin == null) {
        return res.status(404).json({ message: "Invalid adminId" });
      }
      return res.status(200).json({ admin: admin.toProfileJSON() });
    });
  }
});

// Remove admin
adminRouter.delete("/", auth.required, async (req, res, next) => {
  const isSessionActive = await validateAdminSession(req.body.requester);
  if (isSessionActive === "error") {
    return res
      .status(500)
      .json({ error: "Admin session closed due to server error" });
  } else if (!isSessionActive) {
    return res.status(400).json({ message: "Requester not logged in" });
  }

  if (req.body.adminToDelete === req.body.requester) {
    return res.status(403).json({ error: "Can't delete self" });
  }

  let userId = req.body.adminToDelete;
  let requesterId = req.body.requester;

  const isUserAdmin = await validateUserRole(requesterId);
  if (isUserAdmin == "invalid") {
    return res.status(422).json({ message: "Invalid adminId" });
  } else if (isUserAdmin == "operator") {
    return res.status(403).json({ message: "Requester is not an admin" });
  }

  Admin.findOneAndDelete({ adminId: userId }, (err, admin) => {
    if (err) {
      next(err);
    }
    if (admin == null) {
      return res
        .status(404)
        .json({ message: "User with given ID was not found" });
    } else {
      logger.info(
        "Admin with id : " +
          userId +
          "was deleted. Request sent by admin with id : " +
          requesterId
      );
      return res.status(200).json({ message: "User deleted." });
    }
  });
});

// Register a new admin
adminRouter.post("/register", (req, res, next) => {
  if (
    !req.body.userId ||
    !req.body.username ||
    !req.body.role ||
    !req.body.password ||
    !req.body.phoneNumber ||
    !req.body.email
  ) {
    return res.status(400).json({ message: "Fill all fields" });
  }

  // Check if admin with the same userId or email already exists.
  Admin.find({
    $or: [
      { adminId: req.body.userId },
      { adminName: req.body.username },
      { adminName: req.body.email },
    ],
  }).then((admin) => {
    if (admin.length != 0) {
      return res.status(400).json({ message: "Admin already exists" });
    } else {
      if (roles.indexOf(req.body.role) === -1) {
        return res.status(400).json({ message: "Invalid role" });
      }

      let admin = new Admin();
      admin.adminName = req.body.username;
      admin.setPassword(req.body.password);
      admin.email = req.body.email;
      admin.phone = req.body.phoneNumber;
      admin.adminId = req.body.userId;
      admin.role = req.body.role;
      admin
        .save()
        .then(() => {
          return res.json({ admin: admin.toProfileJSON() });
        })
        .catch(next);
    }
  });
});

export default adminRouter;
