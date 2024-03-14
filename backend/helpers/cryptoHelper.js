// cryptoHelper.js
const crypto = require("crypto");

//Grab from env file
const SECRET_KEY = process.env.SECRET_KEY;
const ALGORITHM = process.env.ALGORITHM;

const encrypt = (text) => {
  const cipher = crypto.createCipher(ALGORITHM, SECRET_KEY);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

const decrypt = (text) => {
  const decipher = crypto.createDecipher(ALGORITHM, SECRET_KEY);
  let decrypted = decipher.update(text, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

module.exports = { encrypt, decrypt };
