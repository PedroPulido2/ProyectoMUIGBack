const express = require('express');
const router = express.Router();
const db = require('../config/bd');
const createUpload = require('../middlewares/upload');
const drive = require('../config/drive');
const fs = require('fs');
const upload = createUpload('ID_MINERAL');

const id_Carpeta_Drive = '1a0dUrckJ94wYICyNS_tvj3-DUcf75O9f';

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
router.post('/', upload.single('FILE'), async (req, res) => {
    const { ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
        CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION } = req.body;

    var FOTO = '';

    try {
        // Verificar si el ID ya existe en la base de datos
        const [existing] = await db.query(
            'SELECT 1 FROM mineral WHERE ID_MINERAL = ?',
            [ID_MINERAL]
        );

        // Si ya existe, devolver un error sin subir la imagen
        if (existing.length > 0) {
            return res.status(400).json({ error: 'El id_mineral ya esta en uso, ingrese uno diferente' });
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
            'INSERT INTO mineral (ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION, CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
                CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO
            ]
        );
        res.status(201).json({ message: 'Datos del mineral registrados correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al insertar los datos del mineral' });
    }
});

//Actulizar los datos del mineral
router.put('/:ID_MINERALPARAM', upload.single('FILE'), async (req, res) => {
    const { ID_MINERALPARAM } = req.params;
    const { ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
        CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION } = req.body;

    var FOTO = '';
    try {
        //Obtener la imagen actual desde la BD
        const [rows] = await db.query('SELECT FOTO FROM mineral WHERE ID_MINERAL = ?', [ID_MINERAL]);
        if (rows.length === 0) {
            return res.status(404).json({ error: `El ID del mineral: ${ID_MINERAL} no fue encontrado` });
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
        //Obtener la imagen actual desde la BD
        const [rows] = await db.query('SELECT FOTO FROM mineral WHERE ID_MINERAL = ?', [ID_MINERAL]);
        if (rows.length === 0) {
            return res.status(404).json({ error: `El ID del mineral: ${ID_MINERAL} no fue encontrado` });
        }

        const currentFotoUrl = rows[0].FOTO;
        const currentFileId = currentFotoUrl.split('/d/')[1];

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await drive.files.delete({ fileId: currentFileId }).catch(console.error);
        }

        //Consulta para borrar los demas datos
        const [result] = await db.query('DELETE FROM mineral WHERE ID_MINERAL = ?', [ID_MINERAL]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `El ID del mineral: ${ID_MINERAL} no fue encontrado` });
        }
        res.status(200).json({ message: `El mineral fue eliminado correctamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar los datos del mineral' });
    }
});


//Eliminar imagen de un mineral
router.delete('/:ID_MINERAL/image', async (req, res) => {
    const { ID_MINERAL } = req.params;

    try {
        // Obtener la URL de la imagen actual de la pieza desde la base de datos
        const [rows] = await db.query('SELECT FOTO FROM mineral WHERE ID_MINERAL = ?', [ID_MINERAL]);
        if (rows.length === 0) {
            return res.status(404).json({ error: `El ID del mineral: ${ID_MINERAL} no fue encontrado` });
        }
        const currentFotoUrl = rows[0].FOTO;

        if (!currentFotoUrl) {
            return res.status(400).json({ error: 'El mineral no tiene una imagen asociada' });
        }

        // Extraer el ID del archivo de Google Drive desde la URL
        const currentFileId = currentFotoUrl.split('/d/')[1];

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await drive.files.delete({ fileId: currentFileId }).catch(console.error);
        }

        // Actualizar el campo FOTO a NULL en la base de datos
        await db.query('UPDATE mineral SET FOTO = "" WHERE ID_MINERAL = ?', [ID_MINERAL]);

        res.status(200).json({ message: `La imagen del mineral con ID ${ID_MINERAL} fue eliminada correctamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la imagen del mineral' });
    }
});


module.exports = router;