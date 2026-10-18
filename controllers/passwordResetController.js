const crypto = require('crypto');
const bcrypt = require('bcrypt');
const profileModel = require('../models/profileModel');
const loginModel = require('../models/loginModel');
const { sendPasswordResetEmail, buildResetLink } = require('../services/mailService');
const { logEvent } = require('../middlewares/logger');

/**
 * Controlador de recuperación de contraseña por correo.
 * Flujo: forgot-password genera un token plano que viaja solo en el email;
 * en BD solo se guarda su hash SHA-256 + expiración (1 hora, un solo uso).
 */

const GENERIC_MESSAGE = 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Recuerda revisar la carpeta de spam si no lo ves en tu bandeja de entrada.';
const MIN_PASSWORD_LENGTH = 8;

// Rate-limit simple en memoria: máx 5 solicitudes/hora por IP+correo.
const attemptsByKey = new Map();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(key) {
    const now = Date.now();
    const entry = attemptsByKey.get(key);
    if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
        attemptsByKey.set(key, { count: 1, start: now });
        return false;
    }
    entry.count += 1;
    return entry.count > RATE_LIMIT_MAX;
}

function hashToken(plainToken) {
    return crypto.createHash('sha256').update(plainToken).digest('hex');
}

function isConnectionError(error) {
    return error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET'
        || error.code === '08006' || error.code === '08001' || error.code === '57P01';
}

const forgotPassword = async (req, res) => {
    const { correo } = req.body || {};

    if (!correo || typeof correo !== 'string' || !correo.trim()) {
        return res.status(400).json({ error: 'El correo es obligatorio' });
    }

    const normalized = correo.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        return res.status(400).json({ error: 'El correo no tiene un formato válido' });
    }

    if (isRateLimited(`${req.ip}:${normalized}`)) {
        return res.status(200).json({ message: GENERIC_MESSAGE });
    }

    try {
        const rows = await profileModel.getByCorreo(normalized);

        if (rows.length === 0) {
            await logEvent({
                user: normalized,
                activity: 'PASSWORD_RESET_REQUEST',
                ip: req.ip,
                module: 'LOGIN',
                status: 'DENIED',
                detail: 'Solicitud de recuperación para correo no registrado'
            });
            return res.status(200).json({ message: GENERIC_MESSAGE });
        }

        const perfil = rows[0];
        const plainToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(plainToken);

        const saveResult = await profileModel.saveResetToken(perfil.id_Perfil, tokenHash);
        if (saveResult.rowCount === 0) {
            console.error(`forgotPassword: no se pudo guardar el token para id_Perfil=${perfil.id_Perfil} (0 filas afectadas)`);
            await logEvent({
                id_user: perfil.id_Perfil,
                user: perfil.correo,
                activity: 'PASSWORD_RESET_REQUEST',
                ip: req.ip,
                module: 'LOGIN',
                status: 'ERROR',
                detail: 'No se pudo guardar el token de recuperación'
            });
            return res.status(500).json({ error: 'Error al procesar la solicitud, intenta de nuevo' });
        }

        try {
            await sendPasswordResetEmail(perfil.correo, buildResetLink(plainToken));
        } catch (mailError) {
            console.error('Error al enviar correo de recuperación:', mailError.message);
            await profileModel.clearResetToken(perfil.id_Perfil);
            await logEvent({
                id_user: perfil.id_Perfil,
                user: perfil.correo,
                activity: 'PASSWORD_RESET_REQUEST',
                ip: req.ip,
                module: 'LOGIN',
                status: 'ERROR',
                detail: 'No se pudo enviar el correo de recuperación'
            });
            return res.status(200).json({ message: GENERIC_MESSAGE });
        }

        await logEvent({
            id_user: perfil.id_Perfil,
            user: perfil.correo,
            activity: 'PASSWORD_RESET_REQUEST',
            ip: req.ip,
            module: 'LOGIN',
            status: 'OK',
            detail: 'Se envió enlace de recuperación'
        });

        return res.status(200).json({ message: GENERIC_MESSAGE });
    } catch (error) {
        console.error('Error en forgotPassword:', error.message);
        if (isConnectionError(error)) {
            return res.status(503).json({ error: 'El servicio se está iniciando o reconectando, por favor intenta en unos segundos.' });
        }
        return res.status(200).json({ message: GENERIC_MESSAGE });
    }
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body || {};

    if (!token || typeof token !== 'string' || !token.trim()) {
        return res.status(400).json({ error: 'El token es obligatorio' });
    }
    if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` });
    }

    try {
        const rows = await profileModel.getByResetHash(hashToken(token.trim()));

        if (rows.length === 0) {
            // Diagnóstico solo en logs del servidor; al cliente siempre el mismo 400 genérico.
            try {
                const anyRows = await profileModel.getResetRowByHash(hashToken(token.trim()));
                if (anyRows.length === 0) {
                    console.warn('resetPassword: hash de token no encontrado en perfil (¿enlace viejo o BD distinta?)');
                } else {
                    console.warn(`resetPassword: token encontrado pero expirado (expiraba: ${anyRows[0].reset_token_expires_at}, id_Perfil=${anyRows[0].id_Perfil})`);
                }
            } catch (diagError) {
                console.warn('resetPassword: no se pudo diagnosticar el token:', diagError.message);
            }
            return res.status(400).json({ error: 'Token inválido o expirado' });
        }

        const perfil = rows[0];
        const loginRows = await loginModel.getByIdPerfil(perfil.id_Perfil);

        if (loginRows.length === 0) {
            return res.status(400).json({ error: 'Token inválido o expirado' });
        }

        const user = loginRows[0].user;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await loginModel.updatePassword(user, hashedPassword);
        if (result.rowCount === 0) {
            return res.status(400).json({ error: 'Token inválido o expirado' });
        }

        // Token de un solo uso + la cuenta vuelve a quedar operativa (el email demostró propiedad).
        await profileModel.clearResetToken(perfil.id_Perfil);
        await loginModel.resetFailedAttempts(user);
        await loginModel.unlockUser(user);

        await logEvent({
            id_user: perfil.id_Perfil,
            user,
            activity: 'PASSWORD_RESET_SUCCESS',
            ip: req.ip,
            module: 'LOGIN',
            status: 'OK',
            detail: `El usuario ${user} restableció su contraseña vía correo`
        });

        return res.status(200).json({ message: 'Contraseña actualizada con éxito' });
    } catch (error) {
        console.error('Error en resetPassword:', error.message);
        if (isConnectionError(error)) {
            return res.status(503).json({ error: 'El servicio se está iniciando o reconectando, por favor intenta en unos segundos.' });
        }
        return res.status(500).json({ error: 'Error al restablecer la contraseña' });
    }
};

module.exports = { forgotPassword, resetPassword };
