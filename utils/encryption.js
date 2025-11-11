const crypto = require("crypto");
const ALGORITHM = "aes-256-cbc";
const KEY = crypto.scryptSync("clave_super_segura", "salt", 32);
const IV = Buffer.alloc(16, 0);

const encrypt = (text) => {
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

const decrypt = (encryptedText) => {
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

module.exports = { encrypt, decrypt };
