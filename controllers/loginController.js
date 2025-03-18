const Login = require('../models/loginModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Controlador login
 * En este archivo se definen los controladores asociados al manejo del login, se controlan los errores y solicitudes.
 * NOTA: Este es para fin de pruebas con postman, a partir de perfilController se hace tambien gestion para la tabla login con 
 * funciones auxiliares para la contraseña. 
 */

const getAllLogins = async (req, res) => {
    try {
        const users = await Login.getAllLogins();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error al obtener credenciales de los usuarios:', error.message);
        res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
};

const getLoginByUser = async (req, res) => {
    const { user } = req.params;
    try {
        const result = await Login.getLoginByUser(user);
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

        await Login.createLogin(user, hashedPassword, id_Perfil);
        res.status(201).json({ message: 'El usuario fue registrado con exito' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El nombre de usuario ya esta en uso' });
        }
        console.error('Error al crear el usuario:', error.message);
        res.status(500).json({ error: 'Error al insertar el usuario' });
    }
};

const updateLogin = async (req, res) => {
    const { userParam } = req.params;
    const { user, password, id_Perfil } = req.body;

    try {
        //Cifrar contraseñas
        const salt = await bcrypt.genSalt(10); //genera un salt
        const hashedPassword = await bcrypt.hash(password, salt); //genera la constrasena cifrada

        const result = await Login.updateLogin(user, hashedPassword, id_Perfil, userParam);

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
        const result = await Login.deleteLogin(user);

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
        const row = await Login.getLoginByUser(user);

        if (row.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
        const userData = row[0];

        //comparar la contraseña ingresada con el hash almacenado
        const isMatch = await bcrypt.compare(password, userData.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { id_Perfil: userData.id_Perfil, user: userData.user, isAdmin: userData.isAdmin, foto: userData.foto },
            process.env.SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.status(200).json({ message: 'Autenticacion exitosa', token });
    } catch (error) {
        console.error('Error al autenticar el usuario:', error.message);
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

        const row = await Login.getLoginByUser(user);
        if (row.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
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
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "No autorizado" });
    
    const { user } = req.params;
    const { password } = req.body;

    try {
        //Cifrar contraseñas
        const salt = await bcrypt.genSalt(10); //genera un salt
        const hashedPassword = await bcrypt.hash(password, salt); //genera la constrasena cifrada

        const result = await Login.updatePassword(user, hashedPassword);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado u registrado' });
        }
        res.status(200).json({ message: 'Contraseña actualizada con exito' });
    } catch (error) {
        console.error('Error al actualizar la contraseña:', error.message);
        res.status(500).json({ error: 'Error al actualizar la contraseña' });
    }
};

module.exports = { getAllLogins, getLoginByUser, createLogin, updateLogin, deleteLogin, authUser, verifyPassword, updatePassword }