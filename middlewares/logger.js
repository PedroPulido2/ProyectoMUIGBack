import fs from "fs-extra";
import { encrypt } from "../utils/encryption.js";
import os from "os";

const logFile = "./logs/system.log";

export async function logEvent(data) {
  const logEntry = {
    fecha: new Date().toISOString(),
    id_usuario: data.id_usuario || "anon",
    actividad: data.actividad,
    ip: data.ip || "no_detectada",
    mac: data.mac || os.hostname(),
    endpoint: data.endpoint || "desconocido",
    estado: data.estado || "OK",
    detalle: data.detalle || "",
  };

  const encrypted = encrypt(JSON.stringify(logEntry));
  await fs.appendFile(logFile, encrypted + "\n");
}

// Middleware opcional para registrar automáticamente cada petición
export function loggerMiddleware(req, res, next) {
  const id_usuario = req.user?.id || "anon";
  logEvent({
    id_usuario,
    actividad: `${req.method} ${req.originalUrl}`,
    ip: req.ip,
    endpoint: req.originalUrl,
  });
  next();
}
