const express = require('express');
const router = express.Router();
const db = require('../config/bd');
const bcrypt = require('bcrypt');

//Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM login');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
});

//insertar un usuario
router.post('/', async (req, res) => {
    const { user, password } = req.body;

    try {
        //Cifrar contraseñas
        const salt = await bcrypt.genSalt(10); //genera un salt
        const hashedPassword = await bcrypt.hash(password, salt); //genera la constrasena cifrada

        const [result] = await db.query(
            'INSERT INTO login (user, password) VALUES (?,?)',
            [user, hashedPassword]
        );
        console.log(result)
        res.status(201).json({ message: 'El usuario fue registrado con exito' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El nombre de usuario ya esta en uso' });
        }
        res.status(500).json({ error: 'Error al insertar el usuario' });
    }
});

//Actualizar un usuario
router.put('/:userParam', async (req, res) => {
    const { userParam } = req.params;
    const { user, password } = req.body;

    try {
        //Cifrar contraseñas
        const salt = await bcrypt.genSalt(10); //genera un salt
        const hashedPassword = await bcrypt.hash(password, salt); //genera la constrasena cifrada

        const [result] = await db.query(
            'UPDATE login SET user = ?, password = ? WHERE user = ?',
            [user, hashedPassword, userParam]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado u registrado' });
        }
        res.json({ message: 'El usuario fue actualizado con exito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar los datos del usuario' });
    }
});

//Eliminar un usuario
router.delete('/:userParam', async (req, res) => {
    const { userParam } = req.params;
    try {
        const [result] = await db.query(
            'DELETE FROM login WHERE user = ?',
            [userParam]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'El usuario no fue encontrado' });
        }
        res.json({ message: 'El usuario fue eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
});

//Autenticacion del usuario
router.post('/auth', async (req, res) => {
    const { user, password } = req.body;

    try {
        const [rows] = await db.query('SELECT * FROM login WHERE user = ?', [user]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
        const userData = rows[0];

        //comparar la contraseña ingresada con el hash almacenado
        const isMatch = await bcrypt.compare(password, userData.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        res.json({ message: 'Autenticacion exitosa', user: userData.user });
    } catch (error) {
        res.status(500).json({ error: 'Error al autenticar el usuario' });
    }
});

module.exports = router;