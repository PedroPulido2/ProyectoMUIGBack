const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "No autorizado. Ausencia el token." });
  }

  const token = authHeader.split(" ")[1]; // "Bearer <token>"
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido o expirado." });
  }
}

module.exports = authMiddleware;
