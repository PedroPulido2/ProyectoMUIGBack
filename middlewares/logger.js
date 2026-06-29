const fs = require("fs-extra");
const { encrypt, decrypt } = require("../utils/encryption.js");
const os = require("os");
const driveServices = require("../services/driveServices.js");
const path = require("path");

const logDir = "./logs";
const logFile = path.join(logDir, "system.log");

const restoreLogFromDrive = async () => {
  try {
    await fs.ensureDir(logDir);

    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `system_${timestamp}.log`;
    const folderId = process.env.ID_CARPETA_DRIVE_LOG;

    console.log("Comprobando si existe un log de hoy en Drive tras el reinicio...");
    const existingFileId = await driveServices.searchFileInDrive(fileName, folderId);

    if (existingFileId) {
      console.log(`Log encontrado en Drive. Descargando y restaurando localmente...`);
      await driveServices.downloadFileFromDrive(existingFileId, logFile);
      console.log("Log local restaurado exitosamente.");
    } else {
      console.log("No hay log en Drive para hoy. Iniciando archivo nuevo.");
      if (!fs.existsSync(logFile)) {
        await fs.writeFile(logFile, "");
      }
    }
  } catch (error) {
    console.error("Error al intentar restaurar el log desde Drive:", error.message);
    if (!fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, "");
    }
  }
};

restoreLogFromDrive();

const logEvent = async (data) => {
  try {
    await fs.ensureDir(logDir);
    if (!fs.existsSync(logFile)) {
      await fs.writeFile(logFile, "");
    }

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
  } catch (err) {
    console.error("Error al registrar evento en log:", err.message);
  }
};

const getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchColumn = req.query.searchColumn ? req.query.searchColumn.toUpperCase() : null;
    const searchTerm = req.query.searchTerm ? req.query.searchTerm.toLowerCase().trim() : "";

    if (!fs.existsSync("./logs/system.log")) {
      return res.status(200).json({ data: [], currentPage: 1, totalPages: 1 });
    }

    const data = fs.readFileSync("./logs/system.log", "utf8").split("\n").filter(Boolean);

    let logs = data.map(line => {
      try {
        return JSON.parse(decrypt(line));
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    if (searchTerm && searchColumn) {
      logs = logs.filter(log => {
        const valueValue = log[searchColumn];
        if (valueValue === undefined || valueValue === null) return false;

        return String(valueValue).toLowerCase().includes(searchTerm);
      });
    }

    logs.sort((a, b) => new Date(b.DATE) - new Date(a.DATE));

    const totalRecords = logs.length;
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    const safePage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (safePage - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedLogs = logs.slice(startIndex, endIndex);

    res.status(200).json({
      data: paginatedLogs,
      currentPage: safePage,
      totalPages: totalPages,
      totalRecords: totalRecords
    });

  } catch (error) {
    console.error("Error al procesar y paginar logs:", error.message);
    res.status(500).json({ error: "No se pudieron procesar los logs del sistema" });
  }
};

const uploadLogToDrive = async (req, res) => {
  try {
    if (!fs.existsSync(logFile)) {
      console.log("No hay archivo de logs local para subir.");
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `system_${timestamp}.log`;
    const tempPath = path.join(os.tmpdir(), fileName);

    await fs.copyFile(logFile, tempPath);

    const folderId = process.env.ID_CARPETA_DRIVE_LOG;

    const existingFileId = await driveServices.searchFileInDrive(fileName, folderId);

    let driveResultUrl = "";

    if (existingFileId) {
      //Actualizar
      await driveServices.updateFileContent(existingFileId, tempPath, "text/plain");
      driveResultUrl = `https://drive.google.com/file/d/${existingFileId}`;
    } else {
      //Crear nuevo del dia
      const file = {
        path: tempPath,
        originalname: fileName,
        mimetype: "text/plain",
      };

      driveResultUrl = await driveServices.uploadFileToDrive(
        file,
        folderId,
        fileName.replace(".log", "")
      );
      const newFileId = driveResultUrl.split("/d/")[1].split("/")[0];
      await driveServices.protectFileInDrive(newFileId);
    }

    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    if (res) {
      res.status(200).json({ message: "Logs sincronizados correctamente", url: driveResultUrl });
    }

  } catch (error) {
    console.error("Error al sincronizar logs con Google Drive:", error.message);
    if (res && !res.headersSent) {
      res.status(500).json({ error: "Error interno al subir logs" });
    }
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
}, 60000); // 10 minutos (10 * 60 * 1000)