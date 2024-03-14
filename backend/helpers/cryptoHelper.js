const crypto = require("crypto");

// Make sure SECRET_KEY is 32 bytes for aes-256-ctr.
const SECRET_KEY = crypto
  .createHash("sha256")
  .update(String(process.env.SECRET_KEY))
  .digest("base64")
  .substr(0, 32);
const ALGORITHM = process.env.ALGORITHM || "aes-256-ctr";

// Generates a random IV for each encryption.
const generateIV = () => crypto.randomBytes(16); // AES block size is 16 bytes for CTR mode.

const encrypt = (text) => {
  const iv = generateIV();
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted; // IV needed for decryption
};

const decrypt = (hash) => {
  const parts = hash.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encryptedText = parts.join(":");
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

module.exports = { encrypt, decrypt };
