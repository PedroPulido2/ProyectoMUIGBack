const loginModel = require('../models/loginModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { logEvent } = require('../middlewares/logger');
/**
 * Controlador login
 * En este archivo se definen los controladores asociados al manejo del login, se controlan los errores y solicitudes.
 * NOTA: Este es para fin de pruebas con postman, a partir de perfilController se hace tambien gestion para la tabla login con 
 * funciones auxiliares para la contraseña. 
 */

const MAX_INTENTOS = 5; // Numero maximo de intentos fallidos antes de bloquear la cuenta

const getAllLogins = async (req, res) => {
    try {
        const users = await loginModel.getAll();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error al obtener credenciales de los usuarios:', error.message);
        res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
};

const getLoginByUser = async (req, res) => {
    const { user } = req.params;
    try {
        const result = await loginModel.getByUser(user);
        if (result.length === 0) {
            return res.status(404).json({ error: 'El usuario no se encuentra registrado' });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error al obtener el usuario:', error.message);
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
};

const createLogin = async (req, res) => {
    const { user, password, id_Perfil } = req.body;

    // Validar que se envíen el usuario y la contraseña
    if (!user || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
    }

    try {
        // Generar un salt para cifrar la contraseña
        const salt = await bcrypt.genSalt(10);
        if (!salt) {
            throw new Error('No se pudo generar el salt para cifrar la contraseña');
        }

        // Generar el hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, salt);
        if (!hashedPassword) {
            throw new Error('No se pudo generar el hash de la contraseña');
        }

        await loginModel.create(user, hashedPassword, id_Perfil);
        res.status(201).json({ message: 'El usuario fue registrado con exito' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El nombre de usuario ya esta en uso' });
        }
        console.error('Error al crear el usuario:', error.message);
        res.status(500).json({ error: 'Error al insertar el usuario' });
    }
};

//???????????????????????????????????????
const updateLogin = async (req, res) => {
    const { userParam } = req.params;
    const { user, password, id_Perfil } = req.body;

    try {
        //Cifrar contraseñas
        const salt = await bcrypt.genSalt(10); //genera un salt
        const hashedPassword = await bcrypt.hash(password, salt); //genera la constrasena cifrada

        const result = await loginModel.updateLogin(user, hashedPassword, id_Perfil, userParam);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado u registrado' });
        }
        res.status(200).json({ message: 'El usuario fue actualizado con exito' });
    } catch (error) {
        console.error('Error al actualizar el usuario:', error.message);
        res.status(500).json({ error: 'Error al actualizar los datos del usuario' });
    }
};

const deleteLogin = async (req, res) => {
    const { user } = req.params;
    try {
        const result = await loginModel.delete(user);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'El usuario no fue encontrado' });
        }
        res.status(200).json({ message: 'El usuario fue eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el usuario:', error.message);
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
};

const authUser = async (req, res) => {
    const { user, password } = req.body;

    try {
        const row = await loginModel.getByUser(user);

        if (row.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrecto' });
        }
        const userData = row[0];

        // Si la cuenta está bloqueada
        if (userData.estado === 'BLOQUEADO') {
            await logEvent({
                id_user: userData.id_Perfil,
                user: userData.user,
                activity: 'LOGIN_BLOCKED',
                ip: req.ip,
                module: 'LOGIN',
                status: 'DENIED',
                detail: 'Cuenta bloqueada por múltiples intentos fallidos'
            });
            return res.status(403).json({ error: 'La cuenta está bloqueada. Contacte al administrador.' });
        }

        //comparar la contraseña ingresada con el hash almacenado
        const isMatch = await bcrypt.compare(password, userData.password);

        if (!isMatch) {
            await loginModel.increaseFailedAttempts(user, MAX_INTENTOS);
            return res.status(401).json({ error: 'Usuario o contraseña incorrecto' });
        }

        await loginModel.resetFailedAttempts(user);

        // Generar el token JWT
        const token = jwt.sign(
            { id_Perfil: userData.id_Perfil, user: userData.user, isAdmin: userData.isAdmin, foto: userData.foto },
            process.env.SECRET_KEY,
            { expiresIn: "1h" }
        );

        await logEvent({
            id_user: userData.id_Perfil,
            user: userData.user,
            activity: 'LOGIN_SUCCESS',
            ip: req.ip,
            module: 'LOGIN',
            status: 'OK',
            detail: 'Inicio de sesión exitoso'
        });

        res.status(200).json({ message: 'Autenticacion exitosa', token });
    } catch (error) {
        console.error('Error al autenticar el usuario:', error.message);

        const esErrorDeConexion = error.message.includes('ECONNREFUSED') || error.code === 'ECONNREFUSED';

        if (!esErrorDeConexion) {
            await logEvent({
                activity: 'LOGIN_ERROR',
                ip: req.ip,
                module: 'LOGIN',
                status: 'ERROR',
                detail: error.message
            });
        }

        if (esErrorDeConexion) {
            return res.status(503).json({ error: 'El servicio se está iniciando, por favor intenta en unos segundos.' });
        }
        
        res.status(500).json({ error: 'Error al autenticar el usuario' });
    }
};

const verifyPassword = async (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "No autorizado" });

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const user = decoded.user;

        const { password } = req.body; // La contraseña ya viene hasheada con SHA-256 desde el frontend

        const row = await loginModel.getByUser(user);
        if (row.length === 0) {
            return res.status(404).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const userData = row[0];

        //verificacion de la contraseña
        const isMatch = await bcrypt.compare(password, userData.password);

        if (!isMatch) {
            return res.status(200).json({ valid: false });
        }

        res.status(200).json({ valid: true });
    } catch (error) {
        console.error('Error al verificar la contraseña:', error.message);
        res.status(500).json({ error: 'Error al verificar la contraseña' });
    }
};

const updatePassword = async (req, res) => {
    const { user } = req.params;
    const { password, idPerfilAccion, usernameAccion } = req.body;

    try {
        //Cifrar contraseñas
        const salt = await bcrypt.genSalt(10); //genera un salt
        const hashedPassword = await bcrypt.hash(password, salt); //genera la constrasena cifrada

        const result = await loginModel.updatePassword(user, hashedPassword);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado u registrado' });
        }

        if (usernameAccion === user) {
            await logEvent({
                id_user: idPerfilAccion,
                user: user,
                activity: 'PASSWORD_UPDATE',
                ip: req.ip,
                module: 'LOGIN',
                status: 'OK',
                detail: `El usuario ${user} ha actualizado su contraseña`
            });
        }

        res.status(200).json({ message: 'Contraseña actualizada con exito' });
    } catch (error) {
        console.error('Error al actualizar la contraseña:', error.message);
        res.status(500).json({ error: 'Error al actualizar la contraseña' });
    }
};

const unlockUser = async (req, res) => {
    const { user } = req.params;
    const { idPerfilAccion, usernameAccion } = req.body;

    try {
        const result = await loginModel.unlockUser(user);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'PROFILE_UNLOCK',
            ip: req.ip,
            module: 'PERFIL',
            status: 'OK',
            detail: `El usuario: ${usernameAccion} desbloqueo la cuenta del usuario ${user}`
        });

        res.status(200).json({ message: `El usuario ${user} fue desbloqueado con éxito` });
    } catch (error) {
        console.error('Error al desbloquear el usuario:', error.message);
        res.status(500).json({ error: 'Error al desbloquear el usuario' });
    }
};

const logoutUser = async (req, res) => {
    try {
        await logEvent({
            id_user: req.body.id_Perfil,
            user: req.params.user,
            activity: 'LOGOUT',
            ip: req.ip,
            module: 'LOGIN',
            status: 'OK',
            detail: 'Se cerro la sesión correctamente'
        });

        res.status(200).json({ message: 'Sesión cerrada correctamente' });
    } catch (error) {
        console.error('Error al cerrar sesión:', error.message);
        res.status(500).json({ error: 'Error al cerrar sesión' });
    }
};

module.exports = { getAllLogins, getLoginByUser, createLogin, updateLogin, deleteLogin, authUser, verifyPassword, updatePassword, unlockUser, logoutUser };