const express = require('express');
const router = express.Router();
const db = require('../config/bd');


//Obtener todas las rocas
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM roca');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las rocas' });
    }
});

//Buscar una roca por su id
router.get('/:ID_ROCA', async (req, res) => {
    const { ID_ROCA } = req.params;
    try {
        const [row] = await db.query('SELECT * FROM roca WHERE ID_ROCA = ?', ID_ROCA);
        if (row.length === 0) {
            return res.status(404).json({ error: 'El ID de la roca no existe' });
        }
        res.status(200).json(row);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las rocas' });
    }
});

//Crear una nueva roca
router.post('/', async (req, res) => {
    const { ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO, 
        MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO roca (ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO, MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO, 
                MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO
            ]
        );
        res.status(201).json({ message: 'Datos de la roca registrados correctamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El id_roca ya esta en uso, ingrese uno diferente' });
        }
        res.status(500).json({ error: 'Error al insertar los datos de la roca' });
    }
});

//Actulizar los datos de la roca
router.put('/:ID_ROCAPARAM', async (req, res) => {
    const { ID_ROCAPARAM } = req.params;
    const { ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO, 
        MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO } = req.body;

    try {
        const [result] = await db.query(
            'UPDATE roca SET ID_ROCA = ?, N_BARRANTES = ?, OTROS = ?, BD_C_VARGAS = ?, TIPO = ?, COLECCION = ?, NOMBRE_PIEZA = ?, DEPARTAMENTO = ?, MUNICIPIO = ?, COLECTOR_DONADOR = ?, CARACTERISTICAS = ?, OBSERVACIONES = ?, UBICACION = ?, FOTO = ? WHERE ID_ROCA = ?',
            [ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO, 
                MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO, ID_ROCAPARAM]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'El ID de la roca no encontrado u registrado' });
        }
        res.status(200).json({ message: `Los datos de la roca ${ID_ROCA} fueron actualizados correctamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar los datos de la roca' });
    }
});

//Eliminar una roca
router.delete('/:ID_ROCA',async (req,res)=>{
    const {ID_ROCA} = req.params;

    try {
        const [result] = await db.query('DELETE FROM roca WHERE ID_ROCA = ?',[ID_ROCA]);
        if (result.affectedRows === 0){
            return res.status(404).json({error: `El ID de la roca: ${ID_ROCA} no fue encontrado`});
        }
        res.status(200).json({message: `La roca fue eliminado correctamente`});
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar los datos de la roca' });
    }
});


module.exports = router;