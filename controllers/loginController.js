const Login = require('../models/loginModel');
const bcrypt = require('bcrypt');

/**
 * Controlador login
 * En este archivo se definen los controladores asociados al manejo del login, se controlan los errores y solicitudes.
 */

const getAllUsers = async (req, res) => {
    try {
        const users = await Login.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error al obtener todos los usuarios:', error.message);
        res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
};

const getUserById = async (req, res) => {
    const { user } = req.params;
    try {
        const result = await Login.getUserById(user);
        if (result.length === 0) {
            return res.status(404).json({ error: 'El usuario no se encuentra registrado' });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error al obtener el usuario:', error.message);
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
};

const createNewUser = async (req, res) => {
    const { user, password } = req.body;

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

        await Login.createUser(user, hashedPassword);
        res.status(201).json({ message: 'El usuario fue registrado con exito' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El nombre de usuario ya esta en uso' });
        }
        console.error('Error al crear el usuario:', error.message);
        res.status(500).json({ error: 'Error al insertar el usuario' });
    }
};

const updateUser = async (req, res) => {
    const { userParam } = req.params;
    const { user, password } = req.body;

    try {
        //Cifrar contraseñas
        const salt = await bcrypt.genSalt(10); //genera un salt
        const hashedPassword = await bcrypt.hash(password, salt); //genera la constrasena cifrada

        const result = await Login.updateUser(user, hashedPassword, userParam);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado u registrado' });
        }
        res.status(200).json({ message: 'El usuario fue actualizado con exito' });
    } catch (error) {
        console.error('Error al actualizar el usuario:', error.message);
        res.status(500).json({ error: 'Error al actualizar los datos del usuario' });
    }
};

const deleteUser = async (req, res) => {
    const { user } = req.params;
    try {
        const result = await Login.deleteUser(user);

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
        const row = await Login.getUserById(user);

        if (row.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
        const userData = row[0];

        //comparar la contraseña ingresada con el hash almacenado
        const isMatch = await bcrypt.compare(password, userData.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        res.status(200).json({ message: 'Autenticacion exitosa', user: userData.user });
    } catch (error) {
        console.error('Error al autenticar el usuario:', error.message);
        res.status(500).json({ error: 'Error al autenticar el usuario' });
    }
};

module.exports = { getAllUsers, getUserById, createNewUser, updateUser, deleteUser, authUser }