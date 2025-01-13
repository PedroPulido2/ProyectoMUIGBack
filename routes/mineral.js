const express = require('express');
const router = express.Router();
const db = require('../config/bd');


//Obtener todos los minerales
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM mineral');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los minerales' });
    }
});

//Buscar un mineral por su id
router.get('/:ID_MINERAL', async (req, res) => {
    const { ID_MINERAL } = req.params;
    try {
        const [row] = await db.query('SELECT * FROM mineral WHERE ID_MINERAL = ?', ID_MINERAL);
        if (row.length === 0) {
            return res.status(404).json({ error: 'El ID del mineral no existe' });
        }
        res.status(200).json(row);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los minerales' });
    }
});

//Crear un nuevo mineral
router.post('/', async (req, res) => {
    const { ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
        CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO mineral (ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION, CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
                CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO
            ]
        );
        res.status(201).json({ message: 'Datos del mineral registrados correctamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El id_mineral ya esta en uso, ingrese uno diferente' });
        }
        res.status(500).json({ error: 'Error al insertar los datos del mineral' });
    }
});

//Actulizar los datos del mineral
router.put('/:ID_MINERALPARAM', async (req, res) => {
    const { ID_MINERALPARAM } = req.params;
    const { ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
        CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO } = req.body;

    try {
        const [result] = await db.query(
            'UPDATE mineral SET ID_MINERAL = ?, N_BARRANTES = ?, COLECCION = ?, NOMBRE_MINERAL = ?, CANTIDAD = ?, GRUPO_MINERALOGICO = ?, REGION = ?, SUBGRUPO = ?, COMPOSICION = ?, CARACTERISTICAS = ?, COLECTOR = ?, OBSERVACIONES = ?, UBICACION = ?, FOTO = ? WHERE ID_MINERAL = ?',
            [ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
                CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO, ID_MINERALPARAM]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'El ID del mineral no encontrado u registrado' });
        }
        res.status(200).json({ message: `Los datos del mineral ${ID_MINERAL} fueron actualizados correctamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar los datos del mineral' });
    }
});

//Eliminar un mineral
router.delete('/:ID_MINERAL', async (req, res) => {
    const { ID_MINERAL } = req.params;

    try {
        const [result] = await db.query('DELETE FROM mineral WHERE ID_MINERAL = ?', [ID_MINERAL]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `El ID del mineral: ${ID_MINERAL} no fue encontrado` });
        }
        res.status(200).json({ message: `El mineral fue eliminado correctamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar los datos del mineral' });
    }
});


module.exports = router;