const express = require('express');
const router = express.Router();
const db = require('../config/bd');
const createUpload = require('../middlewares/upload'); //llamado al middleware to Drive
const drive = require('../config/drive');
const fs = require('fs');
const upload = createUpload('ID_FOSIL')

const id_Carpeta_Drive = '1a0dUrckJ94wYICyNS_tvj3-DUcf75O9f';

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
router.post('/', upload.single('FILE'), async (req, res) => {

    const { ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
        FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
        VITRINA, BANDEJA, OBSERVACIONES } = req.body;

    var FOTO = '';

    try {
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

        //Consulta para la Insercion de datos a la BD
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
        console.log(error);
        res.status(500).json({ error: 'Error al insertar los datos del fosil' });
    }
});

//Actulizar los datos del fosil
router.put('/:ID_FOSILPARAM', upload.single('FILE'), async (req, res) => {
    const { ID_FOSILPARAM } = req.params;
    const { ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
        FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
        VITRINA, BANDEJA, OBSERVACIONES } = req.body;

    var FOTO = '';

    try {
        //Obtener la imagen actual desde la BD
        const [rows] = await db.query('SELECT FOTO FROM fosil WHERE ID_FOSIL = ?', [ID_FOSILPARAM]);
        if (rows.length === 0) {
            return res.status(404).json({ error: `El ID del fósil: ${ID_FOSIL} no fue encontrado` });
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
router.delete('/:ID_FOSIL', async (req, res) => {
    const { ID_FOSIL } = req.params;

    try {
        //Obtener la imagen actual desde la BD
        const [rows] = await db.query('SELECT FOTO FROM fosil WHERE ID_FOSIL = ?', [ID_FOSIL]);
        if (rows.length === 0) {
            return res.status(404).json({ error: `El ID del fósil: ${ID_FOSIL} no fue encontrado` });
        }

        const currentFotoUrl = rows[0].FOTO;
        const currentFileId = currentFotoUrl.split('/d/')[1];

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await drive.files.delete({ fileId: currentFileId }).catch(console.error);
        }

        const [result] = await db.query('DELETE FROM fosil WHERE ID_FOSIL = ?', [ID_FOSIL]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `El ID del fosil: ${ID_FOSIL} no fue encontrado` });
        }
        res.status(200).json({ message: `El fosil fue eliminado correctamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar los datos del fosil' });
    }
});

//Eliminar imagen de un fosil
router.delete('/:ID_FOSIL/image', async (req, res) => {
    const { ID_FOSIL } = req.params;

    try {
        // Obtener la URL de la imagen actual del fósil desde la base de datos
        const [rows] = await db.query('SELECT FOTO FROM fosil WHERE ID_FOSIL = ?', [ID_FOSIL]);
        if (rows.length === 0) {
            return res.status(404).json({ error: `El ID del fósil: ${ID_FOSIL} no fue encontrado` });
        }
        const currentFotoUrl = rows[0].FOTO;

        if (!currentFotoUrl) {
            return res.status(400).json({ error: 'El fósil no tiene una imagen asociada' });
        }

        // Extraer el ID del archivo de Google Drive desde la URL
        const currentFileId = currentFotoUrl.split('/d/')[1];

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await drive.files.delete({ fileId: currentFileId }).catch(console.error);
        }

        // Actualizar el campo FOTO a NULL en la base de datos
        await db.query('UPDATE fosil SET FOTO = "" WHERE ID_FOSIL = ?', [ID_FOSIL]);

        res.status(200).json({ message: `La imagen del fósil con ID ${ID_FOSIL} fue eliminada correctamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la imagen del fósil' });
    }
});

module.exports = router;