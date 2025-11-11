const fs = require("fs-extra");
const { encrypt, decrypt } = require("../utils/encryption.js");
const os = require("os");
const driveServices = require("../services/driveServices.js");
const path = require("path");

const logDir = "./logs";
const logFile = path.join(logDir, "system.log");

const logEvent = async (data) => {
  try {
    await fs.ensureDir(logDir);
    if (!fs.existsSync(logFile)) {
      await fs.writeFile(logFile, "");

      const logEntry = {
        DATE: new Date().toISOString(),
        ID_USER: data.id_user || "anon",
        USER: data.user || "anonimo",
        ACTIVITY: data.activity,
        IP: data.ip || "no_detectada",
        SERVER_NAME: os.hostname(),
        MODULE: data.module || "desconocido",
        STATUS: data.status || "OK",
        DETAIL: data.detail || "",
      };

      const encrypted = encrypt(JSON.stringify(logEntry));
      await fs.appendFile(logFile, encrypted + "\n");
    }
  } catch (err) {
    console.error("Error al registrar evento en log:", err.message);
  }
};

const getLogs = async (req, res) => {
  try {
    const data = fs.readFileSync("./logs/system.log", "utf8").split("\n").filter(Boolean);
    const logs = data.map(line => JSON.parse(decrypt(line)));
    res.status(200).json(logs);
  } catch (error) {
    console.error("Error al leer logs:", error.message);
    res.status(500).json({ error: "No se pudieron leer los logs" });
  }
};

const uploadLogToDrive = async (req, res) => {
  try {
    if (!fs.existsSync(logFile)) {
      console.log("No hay archivo de logs para subir.");
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const tempPath = path.join(os.tmpdir(), `system_${timestamp}.log`);

    await fs.copyFile(logFile, tempPath);

    const file = {
      path: tempPath,
      originalname: `system_${timestamp}.log`,
      mimetype: "text/plain",
    };

    const driveUrl = await driveServices.subirImagenADrive(
      file,
      process.env.ID_CARPETA_DRIVE_LOG,
      `system_${timestamp}.log`
    );


    const fileId = driveUrl.split("/d/")[1].split("/")[0];
    await driveServices.protegerArchivoDrive(fileId);
    console.log("Logs subidos a Google Drive:", driveUrl);
    res.status(200).json({ message: "Logs subidos correctamente" });
  } catch (error) {
    console.error("Error al subir logs a Google Drive:", error.message);
  }
};

const uploadLog = async (req, res) => {
  try {
    const stats = await fs.stat(logFile);
    const lastModified = new Date(stats.mtime).getTime();
    const now = Date.now();

    if (now - lastModified < 15 * 60 * 1000) return;

    await uploadLogToDrive();
    res.status(200).json({ message: "Logs subidos a Google Drive exitosamente." });
  } catch (error) {
    res.status(500).json({ error: "Error al subir logs a Google Drive." });
  }
};

module.exports = { logEvent, getLogs, uploadLogToDrive, uploadLog };

setInterval(() => {
  uploadLogToDrive();
}, 3600000); // cada 1 hora
