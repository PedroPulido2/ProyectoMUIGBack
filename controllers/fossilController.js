require('dotenv').config();

const fosilModel = require('../models/fossilModel');
const driveServices = require('../services/driveServices');
const fossilDriveFolderId = process.env.ID_CARPETA_DRIVE_FOSIL;
const { logEvent } = require('../middlewares/logger');
/**
 * Controlador Fosil
 * En este archivo se definen los controladores asociados al manejo de fosiles, se controlan los errores y solicitudes.
 */

const getAllFossils = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const searchColumn = req.query.searchColumn || null;
        const searchTerm = req.query.searchTerm || null;

        const offset = (page - 1) * limit;

        const result = await fosilModel.getPaginated(limit, offset, searchColumn, searchTerm);

        const totalPages = Math.ceil(result.total / limit);

        res.status(200).json({
            data: result.data,
            currentPage: page,
            totalPages: totalPages,
            totalRecords: result.total
        });
    } catch (error) {
        console.error('Error al obtener los fosiles:', error.message);
        res.status(500).json({ error: 'Error al obtener los fosiles' });
    }
};

const getFossilById = async (req, res) => {
    const { ID_FOSIL } = req.params;
    try {
        const fossil = await fosilModel.findById(ID_FOSIL);
        if (fossil.length === 0) {
            return res.status(404).json({ error: 'El ID del fosil no existe' });
        }
        res.status(200).json(fossil);
    } catch (error) {
        console.error('Error al obtener el fosil:', error.message);
        res.status(500).json({ error: 'Error al obtener el fosil' });
    }
};

const createFossil = async (req, res) => {
    var FOTO = '';

    const { ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
        FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
        VITRINA, BANDEJA, OBSERVACIONES, idPerfilAccion, usernameAccion } = req.body;

    try {
        //Verificar si el ID ya existe en la base de datos
        const fossil = await fosilModel.findById(ID_FOSIL);

        // Si ya existe, devolver un error sin subir la imagen
        if (fossil.length > 0) {
            return res.status(400).json({ error: 'El ID del fosil ya esta en uso, ingrese uno diferente' });
        }

        //Subir imagen a Google Drive si se selecciono una imagen
        if (req.file) {
            FOTO = await driveServices.uploadFileToDrive(req.file, fossilDriveFolderId, ID_FOSIL);
        }
        const fossilData = {
            ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
            FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
            VITRINA, BANDEJA, OBSERVACIONES, FOTO
        };

        await fosilModel.create(fossilData);

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'FOSIL_CREATE',
            ip: req.ip,
            module: 'FOSIL',
            status: 'OK',
            detail: `El usuario: ${usernameAccion} registro un nuevo fosil con id: ${ID_FOSIL}`
        });

        res.status(201).json({ message: 'Datos del fosil registrados correctamente' });
    } catch (error) {
        console.error('Error al insertar los datos del fosil:', error.message);
        res.status(500).json({ error: 'Error al insertar los datos del fosil' });
    }
};

const updateFossil = async (req, res) => {
    var FOTO = '';

    const { ID_FOSILPARAM } = req.params;
    const { ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
        FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
        VITRINA, BANDEJA, OBSERVACIONES, idPerfilAccion, usernameAccion } = req.body;

    try {
        const fossil = await fosilModel.findById(ID_FOSILPARAM);
        //Obtener la imagen actual desde la BD
        const urlPhoto = await fosilModel.getPhoto(ID_FOSILPARAM);
        let currentFotoUrl = null;
        let currentFileId = null;

        if (fossil.length === 0) {
            return res.status(404).json({ error: `El ID del fósil: ${ID_FOSILPARAM} no fue encontrado u registrado` });
        }

        if (urlPhoto.length > 0 && urlPhoto[0].FOTO) {
            currentFotoUrl = urlPhoto[0].FOTO;
            currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;
        }

        //Subir imagen a Google Drive si se proporciona un archivo
        if (req.file) {
            if (currentFileId) {
                await driveServices.deleteFileToDrive(currentFileId);
            }
            FOTO = await driveServices.uploadFileToDrive(req.file, fossilDriveFolderId, ID_FOSIL);
        } else {
            FOTO = currentFotoUrl; //Mantener la imagen actual si no se proporciona una nueva

            //Si se cambia el ID_FOSIL entonces el nombre del archivo relacionado tambien cambia
            if (ID_FOSIL !== ID_FOSILPARAM) {
                const fossilExistente = await fosilModel.findById(ID_FOSIL);

                if (fossilExistente.length > 0) {
                    return res.status(400).json({ error: `El ID_FOSIL: ${ID_FOSIL} ya está en uso` });
                }
                if (currentFileId) {
                    await driveServices.updateFileNameToDrive(currentFileId, ID_FOSIL);
                }
            }
        }

        const fosilData = {
            ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
            FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
            VITRINA, BANDEJA, OBSERVACIONES, FOTO,
        };

        await fosilModel.update(ID_FOSILPARAM, fosilData);

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'FOSIL_UPDATE',
            ip: req.ip,
            module: 'FOSIL',
            status: 'OK',
            detail: `El usuario: ${usernameAccion} edito los datos del fosil con id: ${ID_FOSIL}`
        });

        res.status(200).json({ message: `Los datos del fosil ${ID_FOSIL} fueron actualizados correctamente` });
    } catch (error) {
        console.error('Error al actualizar el fosil:', error.message);
        res.status(500).json({ error: 'Error al actualizar los datos del fosil' });
    }
};

const deleteFossil = async (req, res) => {
    const { ID_FOSIL } = req.params;
    const { idPerfilAccion, usernameAccion } = req.body;

    try {
        // Verificar si el fósil existe en la base de datos
        const fossil = await fosilModel.findById(ID_FOSIL);
        if (!fossil || fossil.length === 0) {
            return res.status(404).json({ error: `El ID del fósil ${ID_FOSIL} no fue encontrado.` });
        }

        //Obtener la imagen actual desde la BD
        const urlPhoto = await fosilModel.getPhoto(ID_FOSIL);
        let currentUrlPhoto = null;
        let currentFileId = null;

        if (urlPhoto.length > 0 && urlPhoto[0].FOTO) {
            currentUrlPhoto = urlPhoto[0].FOTO;
            currentFileId = currentUrlPhoto.split('/d/')[1]?.split('/')[0] || null;
        }

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await driveServices.deleteFileToDrive(currentFileId);
        }

        await fosilModel.delete(ID_FOSIL);

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'FOSIL_DELETE',
            ip: req.ip,
            module: 'FOSIL',
            status: 'OK',
            detail: `El usuario: ${usernameAccion} elimino los datos del fosil con id: ${ID_FOSIL}`
        });

        res.status(200).json({ message: `El fosil fue eliminado correctamente` });
    } catch (error) {
        console.error('Error al eliminar el fosil:', error.message);
        res.status(500).json({ error: 'Error al eliminar los datos del fosil' });
    }
};

const deleteFossilPhoto = async (req, res) => {
    const { ID_FOSIL } = req.params;
    const { idPerfilAccion, usernameAccion } = req.body;

    try {
        const fossil = await fosilModel.findById(ID_FOSIL);
        // Obtener la URL de la imagen actual del fósil desde la base de datos
        const urlPhoto = await fosilModel.getPhoto(ID_FOSIL);
        let currentUrlPhoto = null;
        let currentFileId = null;

        if (urlPhoto.length > 0 && urlPhoto[0].FOTO) {
            currentUrlPhoto = urlPhoto[0].FOTO;
            currentFileId = currentUrlPhoto.split('/d/')[1]?.split('/')[0] || null;
        }

        if (fossil.length === 0) {
            return res.status(404).json({ error: `El ID del fósil: ${ID_FOSIL} no fue encontrado` });
        }

        if (!currentUrlPhoto) {
            return res.status(400).json({ error: 'El fósil no tiene una imagen asociada' });
        }

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await driveServices.deleteFileToDrive(currentFileId);
        }

        await fosilModel.deletePhoto(ID_FOSIL);

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'FOSIL_IMAGE_DELETE',
            ip: req.ip,
            module: 'FOSIL',
            status: 'OK',
            detail: `El usuario: ${usernameAccion} elimino la imagen del fosil con id: ${ID_FOSIL}`
        });

        res.status(200).json({ message: `La imagen del fósil con ID ${ID_FOSIL} fue eliminada correctamente` });
    } catch (error) {
        console.error('Error al eliminar foto del fosil:', error.message);
        res.status(500).json({ error: 'Error al eliminar la imagen del fósil' });
    }
};

module.exports = { getAllFossils, getFossilById, createFossil, updateFossil, deleteFossil, deleteFossilPhoto };