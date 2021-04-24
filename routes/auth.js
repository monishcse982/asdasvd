import jwt from "express-jwt";
import { envs as ENVS } from "../config.js";

let SECRET_KEY = ENVS.SECRET_KEY;

const getTokenFromHeader = function (req) {
  if (
    (req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Token") ||
    (req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer")
  ) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

let auth = {
  required: jwt({
    secret: SECRET_KEY,
    userProperty: "payload",
    getToken: getTokenFromHeader,
    algorithms: ["HS256"],
  }),
  optional: jwt({
    secret: SECRET_KEY,
    userProperty: "payload",
    credentialsRequired: false,
    getToken: getTokenFromHeader,
    algorithms: ["HS256"],
  }),
};

export default auth;
