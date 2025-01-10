const express = require('express');
const router = express.Router();
const db = require('../config/bd');


//Obtener todos los fosiles
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM fosil');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los fosiles' });
    }
});

//Buscar un fosil por su id
router.get('/:ID_FOSIL', async (req, res) => {
    const { ID_FOSIL } = req.params;
    try {
        const [row] = await db.query('SELECT * FROM fosil WHERE ID_FOSIL = ?', ID_FOSIL);
        if (row.length === 0) {
            return res.status(404).json({ error: 'El ID del fosil no existe' });
        }
        res.status(200).json(row);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los fosiles' });
    }
});

//Crear un nuevo fosil
router.post('/', async (req, res) => {
    const { ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
        FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
        VITRINA, BANDEJA, OBSERVACIONES, FOTO } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO fosil (ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD, VITRINA, BANDEJA, OBSERVACIONES, FOTO) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
                FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
                VITRINA, BANDEJA, OBSERVACIONES, FOTO
            ]
        );
        res.status(201).json({ message: 'Datos del fosil registrados correctamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El id_fosil ya esta en uso, ingrese uno diferente' });
        }
        res.status(500).json({ error: 'Error al insertar los datos del fosil' });
    }
});

//Actulizar los datos del fosil
router.put('/:ID_FOSILPARAM', async (req, res) => {
    const { ID_FOSILPARAM } = req.params;
    const { ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
        FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
        VITRINA, BANDEJA, OBSERVACIONES, FOTO } = req.body;

    try {
        const [result] = await db.query(
            'UPDATE fosil SET ID_FOSIL = ?, N_BARRANTES = ?, COLECCION = ?, UBICACION = ?, FILO = ?, SUBFILO = ?, CLASE = ?, ORDEN = ?, FAMILIA = ?, GENERO = ?, NOMBRE_FOSIL = ?, PARTES = ?, TIEMPO_GEOLOGICO = ?, COLECTOR = ?, LOCALIDAD = ?, VITRINA = ?, BANDEJA = ?, OBSERVACIONES = ?, FOTO = ? WHERE ID_FOSIL = ?',
            [ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
                FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
                VITRINA, BANDEJA, OBSERVACIONES, FOTO, ID_FOSILPARAM]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'El ID del fosil no encontrado u registrado' });
        }
        res.status(200).json({ message: `Los datos del fosil ${ID_FOSIL} fueron actualizados correctamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar los datos del fosil' });
    }
});

//Eliminar un fosil
router.delete('/:ID_FOSIL',async (req,res)=>{
    const {ID_FOSIL} = req.params;

    try {
        const [result] = await db.query('DELETE FROM fosil WHERE ID_FOSIL = ?',[ID_FOSIL]);
        if (result.affectedRows === 0){
            return res.status(404).json({error: `El ID del fosil: ${ID_FOSIL} no fue encontrado`});
        }
        res.status(200).json({message: `El fosil fue eliminado correctamente`});
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar los datos del fosil' });
    }
});


module.exports = router;