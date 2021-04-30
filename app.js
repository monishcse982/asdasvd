import express from "express";
import urlencoded from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import { envs as ENVS } from "./config.js";

import mongoConnection from "./utils/mongoConnect.js";
mongoConnection();

import "./models/Admin.js";
import "./models/Client.js";
import "./models/Payments.js";
import "./config/passport.js";

import indexRouter from "./routes/index.js";
import adminRouter from "./routes/api/admin.js";
import clientRouter from "./routes/api/client.js";

const app = express();

app.use(express.json());
app.use(logger("dev"));
app.use(urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/", indexRouter);
app.use("/admin", adminRouter);
app.use("/client", clientRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(httpErrors(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json(err);
});

app.listen(ENVS.PORT, () => {
  console.log(`Server is running on ${ENVS.PORT}`);
});

export default app;
