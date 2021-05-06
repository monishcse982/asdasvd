import aes256 from "aes256";
import { envs as ENVS } from "../config.js";

const key = ENVS.AES_KEY;
var cipher = aes256.createCipher(key);

let encrypt = (input) => {
    return cipher.encrypt(input);
};

let decrypt = (input) => {
    return cipher.decrypt(input);
};

export default {encrypt, decrypt};