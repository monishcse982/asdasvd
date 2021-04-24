import { envs as ENVS } from "../config.js";
import logger from "./logger.js";
import redis from "redis";

let redisClient = redis.createClient({
  port: ENVS.REDIS_PORT,
  host: ENVS.REIDS_HOST,
});

redisClient.on("error", function (error) {
  logger.error(error);
});

export default redisClient;
