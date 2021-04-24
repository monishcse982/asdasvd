import mongoose from "mongoose";
import { envs as ENVS } from "../config.js";

const mongoConnection = async () => {
  let mongooseConnectionString =
    "mongodb://" + ENVS.DB_HOST + ":" + ENVS.DB_PORT + "/" + ENVS.DB;

  return await mongoose.connect(mongooseConnectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });
};

export default mongoConnection;
