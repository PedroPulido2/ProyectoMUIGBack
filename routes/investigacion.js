const express = require('express');
const router = express.Router();
const db = require('../config/bd');
const createUpload = require('../middlewares/upload');
const drive = require('../config/drive');
const fs = require('fs');
const upload = createUpload('ID_PIEZA');

const id_Carpeta_Drive = '1a0dUrckJ94wYICyNS_tvj3-DUcf75O9f';

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
router.post('/', upload.single('FILE'), async (req, res) => {
    const { ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
        ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES } = req.body;

    var FOTO = '';

    try {
        // Verificar si el ID ya existe en la base de datos
        const [existing] = await db.query(
            'SELECT 1 FROM investigacion WHERE ID_PIEZA = ?',
            [ID_PIEZA]
        );

        // Si ya existe, devolver un error sin subir la imagen
        if (existing.length > 0) {
            return res.status(400).json({ error: 'El id_pieza ya esta en uso, ingrese uno diferente' });
        }

        //Subir imagen a Google Drive
        if (req.file) {
            const filePath = req.file.path;

            const response = await drive.files.create({
                requestBody: {
                    name: req.file.filename,
                    mimeType: req.file.mimetype,
                    parents: [id_Carpeta_Drive], //ID de la carpeta de Google Drive
                },
                media: {
                    mimeType: req.file.mimetype,
                    body: fs.createReadStream(filePath),
                },
            });

            //Eliminar archivo temporal del servidor
            fs.unlinkSync(filePath);

            FOTO = `https://lh3.googleusercontent.com/d/${response.data.id}`;
        }

        const [result] = await db.query(
            'INSERT INTO investigacion (ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO, ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
                ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO
            ]
        );
        res.status(201).json({ message: 'Los Datos de la nueva investigacion registrados correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al insertar los datos del la investigacion' });
    }
});

//Actulizar los datos de la investigacion
router.put('/:ID_PIEZAPARAM', upload.single('FILE'), async (req, res) => {
    const { ID_PIEZAPARAM } = req.params;
    const { ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
        ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES } = req.body;

    var FOTO = '';

    try {
        //Obtener la imagen actual desde la BD
        const [rows] = await db.query('SELECT FOTO FROM investigacion WHERE ID_PIEZA = ?', [ID_PIEZA]);
        if (rows.length === 0) {
            return res.status(404).json({ error: `El ID de la pieza: ${ID_PIEZA} no fue encontrado` });
        }

        const currentFotoUrl = rows[0].FOTO;
        const currentFileId = currentFotoUrl.split('/d/')[1];

        //Subir imagen a Google Drive si se proporciona un archivo
        if (req.file) {
            const filePath = req.file.path;

            if (currentFileId) {
                await drive.files.delete({ fileId: currentFileId }).catch(console.error); //Si se reemplaza la imagen, borra la que tiene vinculada para agregar la nueva
            }

            const response = await drive.files.create({
                requestBody: {
                    name: req.file.filename,
                    mimeType: req.file.mimetype,
                    parents: [id_Carpeta_Drive], //ID de la carpeta de Google Drive
                },
                media: {
                    mimeType: req.file.mimetype,
                    body: fs.createReadStream(filePath),
                },
            });

            //Eliminar archivo temporal del servidor
            fs.unlinkSync(filePath);

            FOTO = `https://lh3.googleusercontent.com/d/${response.data.id}`;
        } else {
            FOTO = currentFotoUrl; //Mantener la imagen actual si no se proporciona una nueva
        }

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

//Eliminar una pieza
router.delete('/:ID_PIEZA', async (req, res) => {
    const { ID_PIEZA } = req.params;

    try {
        //Obtener la imagen actual desde la BD
        const [rows] = await db.query('SELECT FOTO FROM investigacion WHERE ID_PIEZA = ?', [ID_PIEZA]);
        if (rows.length === 0) {
            return res.status(404).json({ error: `El ID de la pieza: ${ID_PIEZA} no fue encontrado` });
        }

        const currentFotoUrl = rows[0].FOTO;
        const currentFileId = currentFotoUrl.split('/d/')[1];

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await drive.files.delete({ fileId: currentFileId }).catch(console.error);
        }

        //Consulta para borrar los demas datos
        const [result] = await db.query('DELETE FROM investigacion WHERE ID_PIEZA = ?', [ID_PIEZA]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `El ID de la pieza: ${ID_PIEZA} no fue encontrado` });
        }
        res.status(200).json({ message: `Los datos de la pieza fueron eliminados correctamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar los datos de la investigacion' });
    }
});

//Eliminar imagen de una pieza
router.delete('/:ID_PIEZA/image', async (req, res) => {
    const { ID_PIEZA } = req.params;

    try {
        // Obtener la URL de la imagen actual de la pieza desde la base de datos
        const [rows] = await db.query('SELECT FOTO FROM investigacion WHERE ID_PIEZA = ?', [ID_PIEZA]);
        if (rows.length === 0) {
            return res.status(404).json({ error: `El ID de la pieza: ${ID_PIEZA} no fue encontrado` });
        }
        const currentFotoUrl = rows[0].FOTO;

        if (!currentFotoUrl) {
            return res.status(400).json({ error: 'La pieza no tiene una imagen asociada' });
        }

        // Extraer el ID del archivo de Google Drive desde la URL
        const currentFileId = currentFotoUrl.split('/d/')[1];

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await drive.files.delete({ fileId: currentFileId }).catch(console.error);
        }

        // Actualizar el campo FOTO a NULL en la base de datos
        await db.query('UPDATE investigacion SET FOTO = "" WHERE ID_PIEZA = ?', [ID_PIEZA]);

        res.status(200).json({ message: `La imagen de la pieza con ID ${ID_PIEZA} fue eliminada correctamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la imagen de la pieza' });
    }
});


module.exports = router;