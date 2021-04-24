import mongoose from "mongoose";
import jsonwebtoken from "jsonwebtoken";
import validator from "validator";
import bcrypt from "bcrypt";
import { envs as ENVS } from "../config.js";

let roles = ["admin", "operator"];

let AdminSchema = mongoose.Schema({
  adminName: { type: String, unique: true },
  role: { type: String, enum: roles, default: "operator" },
  adminId: { type: String, unique: true, required: true },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: validator.isMobilePhone,
      message: "Invalid Phone",
    },
    isAsync: false,
  },
  email: {
    type: String,
    required: true,
    validate: {
      validator: validator.isEmail,
      message: "Invalid Email",
    },
    isAsync: false,
  },
  salt: String,
  hash: String,
});

AdminSchema.methods.setPassword = function (password) {
  this.hash = bcrypt.hashSync(password, parseInt(ENVS.SALT_ROUNDS));
};

AdminSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.hash);
};

AdminSchema.methods.generateJWT = function () {
  let now = new Date();
  let expiry = new Date(now.getTime() + ENVS.SESSION_TIMEOUT * 1000);

  return jsonwebtoken.sign(
    {
      _id: this._id,
      adminName: this.adminName,
      exp: parseInt(String(expiry.getTime() / 1000)),
    },
    `${ENVS.SECRET_KEY}`
  );
};

AdminSchema.methods.toAuthJson = function () {
  return {
    username: this.adminName,
    id: this.adminId,
    token: this.generateJWT(),
  };
};

AdminSchema.methods.toProfileJSON = function () {
  return {
    username: this.adminName,
    id: this.adminId,
    phone: this.phone,
    email: this.email,
  };
};

mongoose.model("Admin", AdminSchema);
