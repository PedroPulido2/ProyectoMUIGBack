require('dotenv').config();

const rocaModel = require('../models/rockModel');
const driveServices = require('../services/driveServices');
const rockDriveFolderId = process.env.ID_CARPETA_DRIVE_ROCAS;
const { logEvent } = require('../middlewares/logger');

/**
 * Controlador Roca
 * En este archivo se definen los controladores asociados al manejo de rocas, se controlan los errores y solicitudes.
 */

const getAllRocks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const searchColumn = req.query.searchColumn || null;
        const searchTerm = req.query.searchTerm || null;

        const offset = (page - 1) * limit;

        const result = await rocaModel.getPaginated(limit, offset, searchColumn, searchTerm);

        const totalPages = Math.ceil(result.total / limit);

        res.status(200).json({
            data: result.data,
            currentPage: page,
            totalPages: totalPages,
            totalRecords: result.total
        });
    } catch (error) {
        console.error('Error al obtener todas las rocas:', error.message);
        res.status(500).json({ error: 'Error al obtener las rocas' });
    }
};

const getRockById = async (req, res) => {
    const { ID_ROCA } = req.params;
    try {
        const roca = await rocaModel.findById(ID_ROCA);
        if (roca.length === 0) {
            return res.status(404).json({ error: 'El ID de la roca no existe' });
        }
        res.status(200).json(roca);
    } catch (error) {
        console.error('Error al obtener la roca:', error.message);
        res.status(500).json({ error: 'Error al obtener la roca' });
    }
};

const createRock = async (req, res) => {
    var FOTO = '';

    const { ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
        MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, idPerfilAccion, usernameAccion } = req.body;

    try {
        // Verificar si el ID ya existe en la base de datos
        const roca = await rocaModel.findById(ID_ROCA);

        // Si ya existe, devolver un error sin subir la imagen
        if (roca.length > 0) {
            return res.status(400).json({ error: 'El id_roca ya esta en uso, ingrese uno diferente' });
        }

        //Subir imagen a Google Drive
        if (req.file) {
            FOTO = await driveServices.uploadFileToDrive(req.file, rockDriveFolderId, ID_ROCA);
        }

        const rocaData = {
            ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
            MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO
        }

        await rocaModel.create(rocaData);

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'ROCA_CREATE',
            ip: req.ip,
            module: 'ROCA',
            status: 'OK',
            detail: `El usuario: ${usernameAccion} registro una nueva roca con id: ${ID_ROCA}`
        });

        res.status(201).json({ message: 'Datos de la roca registrados correctamente' });
    } catch (error) {
        console.error('Error al registrar la roca:', error.message);
        res.status(500).json({ error: 'Error al insertar los datos de la roca' });
    }
};

const updateRock = async (req, res) => {
    var FOTO = '';

    const { ID_ROCAPARAM } = req.params;
    const { ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
        MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, idPerfilAccion, usernameAccion } = req.body;

    try {
        const roca = await rocaModel.findById(ID_ROCAPARAM);
        //Obtener la imagen actual desde la BD
        const urlFoto = await rocaModel.getPhoto(ID_ROCAPARAM);
        let currentFotoUrl = null;
        let currentFileId = null;

        if (roca.length === 0) {
            return res.status(404).json({ error: `El ID de la roca: ${ID_ROCA} no fue encontrado` });
        }

        if (urlFoto.length > 0 && urlFoto[0].FOTO) {
            currentFotoUrl = urlFoto[0].FOTO;
            currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;
        }

        //Subir imagen a Google Drive si se proporciona un archivo
        if (req.file) {
            if (currentFileId) {
                await driveServices.deleteFileToDrive(currentFileId);
            }
            FOTO = await driveServices.uploadFileToDrive(req.file, rockDriveFolderId, ID_ROCA);
        } else {
            FOTO = currentFotoUrl; //Mantener la imagen actual si no se proporciona una nueva

            //Si se cambia el ID_ROCA entonces el nombre del archivo relacionado tambien cambia
            if (ID_ROCA !== ID_ROCAPARAM) {
                const rocaExistente = await rocaModel.findById(ID_ROCA);
                if (rocaExistente.length > 0) {
                    return res.status(400).json({ error: `El ID_ROCA: ${ID_ROCA} ya está en uso` });
                }
                if (currentFileId) {
                    await driveServices.updateFileNameToDrive(currentFileId, ID_ROCA);
                }
            }
        }

        const rocaData = {
            ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
            MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO, ID_ROCAPARAM
        }

        await rocaModel.update(ID_ROCAPARAM, rocaData);

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'ROCA_UPDATE',
            ip: req.ip,
            module: 'ROCA',
            status: 'OK',
            detail: `El usuario: ${usernameAccion} edito los datos de la roca con id: ${ID_ROCA}`
        });

        res.status(200).json({ message: `Los datos de la roca ${ID_ROCA} fueron actualizados correctamente` });
    } catch (error) {
        console.error('Error al actualizar la roca:', error.message);
        res.status(500).json({ error: 'Error al actualizar los datos de la roca' });
    }
};

const deleteRock = async (req, res) => {
    const { ID_ROCA } = req.params;
    const { idPerfilAccion, usernameAccion } = req.body;

    try {
        //Verificar si la roca existe en la base de datos
        const roca = await rocaModel.findById(ID_ROCA);
        if (!roca || roca.length === 0) {
            return res.status(404).json({ error: `El ID de la roca ${ID_ROCA} no fue encontrado.` });
        }
        //Obtener la imagen actual desde la BD
        const urlFoto = await rocaModel.getPhoto(ID_ROCA);
        let currentFotoUrl = null;
        let currentFileId = null;

        if (urlFoto.length > 0 && urlFoto[0].FOTO) {
            currentFotoUrl = urlFoto[0].FOTO;
            currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;
        }

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await driveServices.deleteFileToDrive(currentFileId);
        }

        await rocaModel.delete(ID_ROCA);

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'ROCA_DELETE',
            ip: req.ip,
            module: 'ROCA',
            status: 'OK',
            detail: `El usuario: ${usernameAccion} elimino los datos de la roca con id: ${ID_ROCA}`
        });

        res.status(200).json({ message: `La roca fue eliminado correctamente` });
    } catch (error) {
        console.error('Error al eliminar la roca:', error.message);
        res.status(500).json({ error: 'Error al eliminar los datos de la roca' });
    }
};

const deleteRockPhoto = async (req, res) => {
    const { ID_ROCA } = req.params;
    const { idPerfilAccion, usernameAccion } = req.body;

    try {
        const roca = await rocaModel.findById(ID_ROCA);
        // Obtener la URL de la imagen actual de la pieza desde la base de datos
        const urlFoto = await rocaModel.getPhoto(ID_ROCA);
        let currentFotoUrl = null;
        let currentFileId = null;

        if (urlFoto.length > 0 && urlFoto[0].FOTO) {
            currentFotoUrl = urlFoto[0].FOTO;
            currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;
        }

        if (roca.length === 0) {
            return res.status(404).json({ error: `El ID de la roca: ${ID_ROCA} no fue encontrado` });
        }

        if (!currentFotoUrl) {
            return res.status(400).json({ error: 'La roca no tiene una imagen asociada' });
        }

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await driveServices.deleteFileToDrive(currentFileId);
        }

        await rocaModel.deletePhoto(ID_ROCA);

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'ROCA_IMAGE_DELETE',
            ip: req.ip,
            module: 'ROCA',
            status: 'OK',
            detail: `El usuario: ${usernameAccion} elimino la imagen de la roca con id: ${ID_ROCA}`
        });

        res.status(200).json({ message: `La imagen de la roca con ID ${ID_ROCA} fue eliminada correctamente` });
    } catch (error) {
        console.error('Error al eliminar la foto de la roca:', error.message);
        res.status(500).json({ error: 'Error al eliminar la imagen de la roca' });
    }
};

module.exports = { getAllRocks, getRockById, createRock, updateRock, deleteRock, deleteRockPhoto };