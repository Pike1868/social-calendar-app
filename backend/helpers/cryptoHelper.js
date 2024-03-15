const crypto = require("crypto");

// Convert hex string to Buffer
const SECRET_KEY = Buffer.from(process.env.SECRET_KEY, "hex");
const ALGORITHM = "aes-256-ctr";

// Generate a random IV
const IV = crypto.randomBytes(16);
console.log(
  "SECRET_KEY: ",
  SECRET_KEY,
  " Should log 32 as key length: ",
  SECRET_KEY.length
);

const encrypt = (text) => {
  // Check if text is not undefined and is a string
  if (typeof text !== "string") {
    console.error("Encryption error: text must be a string");
    throw new Error("Encryption error: text must be a string");
  }

  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, IV);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  // Prepend the IV for use in decryption
  return IV.toString("hex") + encrypted;
};

const decrypt = (encryptedText) => {
  // Extract the IV from the beginning of the encrypted text
  const iv = Buffer.from(encryptedText.slice(0, 32), "hex");
  encryptedText = encryptedText.slice(32);

  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

module.exports = { encrypt, decrypt };
