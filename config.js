import dotenv from "dotenv";

const result = dotenv.config({ path: "./env/nexGen.env" });

if (result.error) {
  throw result.error;
}
const envs = result.parsed;

export { envs };
