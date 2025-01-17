const express = require('express');
const router = express.Router();
const db = require('../config/bd');
const createUpload = require('../middlewares/upload');
const drive = require('../config/drive');
const fs = require('fs');
const upload = createUpload('ID_ROCA');

const id_Carpeta_Drive = '1a0dUrckJ94wYICyNS_tvj3-DUcf75O9f';

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
router.post('/', upload.single('FILE'), async (req, res) => {
    const { ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO, 
        MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION } = req.body;

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
router.put('/:ID_ROCAPARAM', upload.single('FILE'),async (req, res) => {
    const { ID_ROCAPARAM } = req.params;
    const { ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO, 
        MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION } = req.body;

    var FOTO = '';

    try {
        //Obtener la imagen actual desde la BD
        const [rows] = await db.query('SELECT FOTO FROM roca WHERE ID_ROCA = ?', [ID_ROCA]);
        if (rows.length === 0) {
            return res.status(404).json({ error: `El ID de la roca: ${ID_ROCA} no fue encontrado` });
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
        //Obtener la imagen actual desde la BD
        const [rows] = await db.query('SELECT FOTO FROM roca WHERE ID_ROCA = ?', [ID_ROCA]);
        if (rows.length === 0) {
            return res.status(404).json({ error: `El ID de la roca: ${ID_ROCA} no fue encontrado` });
        }

        const currentFotoUrl = rows[0].FOTO;
        const currentFileId = currentFotoUrl.split('/d/')[1];

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await drive.files.delete({ fileId: currentFileId }).catch(console.error);
        }

        //Consulta para borrar los demas datos
        const [result] = await db.query('DELETE FROM roca WHERE ID_ROCA = ?',[ID_ROCA]);
        if (result.affectedRows === 0){
            return res.status(404).json({error: `El ID de la roca: ${ID_ROCA} no fue encontrado`});
        }
        res.status(200).json({message: `La roca fue eliminado correctamente`});
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar los datos de la roca' });
    }
});

//Eliminar imagen de una roca
router.delete('/:ID_ROCA/image', async (req, res) => {
    const { ID_ROCA } = req.params;

    try {
        // Obtener la URL de la imagen actual de la pieza desde la base de datos
        const [rows] = await db.query('SELECT FOTO FROM roca WHERE ID_ROCA = ?', [ID_ROCA]);
        if (rows.length === 0) {
            return res.status(404).json({ error: `El ID de la roca: ${ID_ROCA} no fue encontrado` });
        }
        const currentFotoUrl = rows[0].FOTO;

        if (!currentFotoUrl) {
            return res.status(400).json({ error: 'La roca no tiene una imagen asociada' });
        }

        // Extraer el ID del archivo de Google Drive desde la URL
        const currentFileId = currentFotoUrl.split('/d/')[1];

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await drive.files.delete({ fileId: currentFileId }).catch(console.error);
        }

        // Actualizar el campo FOTO a NULL en la base de datos
        await db.query('UPDATE roca SET FOTO = "" WHERE ID_ROCA = ?', [ID_ROCA]);

        res.status(200).json({ message: `La imagen de la roca con ID ${ID_ROCA} fue eliminada correctamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la imagen de la roca' });
    }
});



module.exports = router;