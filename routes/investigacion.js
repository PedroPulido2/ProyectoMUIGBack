const express = require('express');
const router = express.Router();
const db = require('../config/bd');


//Obtener todas los datos tabla investigacion
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM investigacion');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las investigaciones' });
    }
});

//Buscar una investigacion por su id
router.get('/:ID_PIEZA', async (req, res) => {
    const { ID_PIEZA } = req.params;
    try {
        const [row] = await db.query('SELECT * FROM investigacion WHERE ID_PIEZA = ?', ID_PIEZA);
        if (row.length === 0) {
            return res.status(404).json({ error: 'El ID de investigacion no existe' });
        }
        res.status(200).json(row);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los datos de la tabla investigacion' });
    }
});

//Crear una nueva investigacion
router.post('/', async (req, res) => {
    const { ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO, 
        ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO investigacion (ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO, ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO, 
                ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO
            ]
        );
        res.status(201).json({ message: 'Los Datos de la nueva investigacion registrados correctamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El Id_Pieza ya esta en uso, ingrese uno diferente' });
        }
        res.status(500).json({ error: 'Error al insertar los datos del la investigacion' });
    }
});

//Actulizar los datos de la investigacion
router.put('/:ID_PIEZAPARAM', async (req, res) => {
    const { ID_PIEZAPARAM } = req.params;
    const { ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO, 
        ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO } = req.body;

    try {
        const [result] = await db.query(
            'UPDATE investigacion SET ID_PIEZA = ?, COLECCION = ?, REPOSITORIO = ?, FILO = ?, SUBFILO = ?, CLASE = ?, ORDEN = ?, FAMILIA = ?, GENERO = ?, NOMBRE = ?, PERIODO_GEOLOGICO = ?, ERA_GEOLOGICA = ?, FORMACION_GEOLOGICA = ?, SECCION_ESTRATIGRAFICA = ?, COLECTOR = ?, LOCALIDAD = ?, OBSERVACIONES = ?, FOTO = ? WHERE ID_PIEZA = ?',
            [ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO, 
                ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO, ID_PIEZAPARAM]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'El ID de la pieza no encontrado u registrado' });
        }
        res.status(200).json({ message: `Los datos de la pieza "${ID_PIEZA}" fueron actualizados correctamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar los datos de la investigacion' });
    }
});

//Eliminar un fosil
router.delete('/:ID_PIEZA',async (req,res)=>{
    const {ID_PIEZA} = req.params;

    try {
        const [result] = await db.query('DELETE FROM investigacion WHERE ID_PIEZA = ?',[ID_PIEZA]);
        if (result.affectedRows === 0){
            return res.status(404).json({error: `El ID de la pieza: ${ID_PIEZA} no fue encontrado`});
        }
        res.status(200).json({message: `Los datos de la pieza fueron eliminados correctamente`});
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar los datos de la investigacion' });
    }
});


module.exports = router;