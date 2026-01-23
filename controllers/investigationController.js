require('dotenv').config();

const InvestigationModel = require('../models/investigationModel');
const driveServices = require('../services/driveServices');
const id_Carpeta_Drive_Principal = process.env.ID_CARPETA_DRIVE_INVESTIGACION;
const id_Carpeta_Drive_AFPC = process.env.ID_CARPETA_DRIVE_INVESTIGACION_AFPC;
const id_Carpeta_Drive_HRR = process.env.ID_CARPETA_DRIVE_INVESTIGACION_HRR;
const id_Carpeta_Drive_MJGL = process.env.ID_CARPETA_DRIVE_INVESTIGACION_MJGL;
const { logEvent } = require('../middlewares/logger');

/**
 * Controlador Investigacion
 * En este archivo se definen los controladores asociados al manejo de investigaciones, se controlan los errores y solicitudes.
 */

const getAllInvestigations = async (req, res) => {
    try {
        const investigations = await InvestigationModel.getAll();
        res.status(200).json(investigations);
    } catch (error) {
        console.error('Error al obtener las investigaciónes:', error.message);
        res.status(500).json({ error: 'Error al obtener las investigaciones' });
    }
};

const getInvestigationById = async (req, res) => {
    const { ID_PIEZA } = req.params;
    try {
        const investigation = await InvestigationModel.findById(ID_PIEZA);
        if (investigation.length === 0) {
            return res.status(404).json({ error: 'El ID de investigacion no existe' });
        }
        res.status(200).json(investigation);
    } catch (error) {
        console.error('Error al obtener la investigación:', error.message);
        res.status(500).json({ error: 'Error al obtener la investigación' });
    }
};

const createInvestigation = async (req, res) => {
    var FOTO = '';

    const { ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
        ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, idPerfilAccion, usernameAccion } = req.body;

    try {
        // Verificar si el ID ya existe en la base de datos
        const investigacion = await InvestigationModel.findById(ID_PIEZA);

        // Si ya existe, devolver un error sin subir la imagen
        if (investigacion.length > 0) {
            return res.status(400).json({ error: 'El id_pieza ya esta en uso, ingrese uno diferente' });
        }
        //Subir imagen a Google Drive
        if (req.file) {
            if (/^MGUPTC-CPi-HRR-\d{3}$/.test(ID_PIEZA)) {
                FOTO = await driveServices.uploadFileToDrive(req.file, id_Carpeta_Drive_HRR, ID_PIEZA);
            } else if (/^MGUPTC-CPi-AFPC-\d{4}[A-Za-z]?$/.test(ID_PIEZA)) {
                FOTO = await driveServices.uploadFileToDrive(req.file, id_Carpeta_Drive_AFPC, ID_PIEZA);
            } else {
                FOTO = await driveServices.uploadFileToDrive(req.file, id_Carpeta_Drive_Principal, ID_PIEZA);
            }
        }

        const investigacionData = {
            ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
            ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO
        };

        await InvestigationModel.create(investigacionData);

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'INVESTIGACION_CREATE',
            ip: req.ip,
            module: 'INVESTIGACION',
            status: 'OK',
            detail: `El usuario: ${usernameAccion} registro una nueva pieza con id: ${ID_PIEZA}`
        });

        res.status(201).json({ message: 'Los Datos de la nueva investigacion registrados correctamente' });
    } catch (error) {
        console.error('Error al crear la investigación:', error.message);
        res.status(500).json({ error: 'Error al crear la investigación' });
    }
};

const updateInvestigation = async (req, res) => {
    var FOTO = '';

    const { ID_PIEZAPARAM } = req.params;
    const { ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
        ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, idPerfilAccion, usernameAccion } = req.body;

    try {
        const pieza = await InvestigationModel.findById(ID_PIEZAPARAM);
        const urlFoto = await InvestigationModel.getPhoto(ID_PIEZAPARAM);
        let currentFotoUrl = null;
        let currentFileId = null;
        let currentFolderId = null;
        let newFolderId = null;

        if (pieza.length === 0) {
            return res.status(404).json({ error: `El ID de la pieza: ${ID_PIEZAPARAM} no fue encontrado` });
        }

        if (urlFoto.length > 0 && urlFoto[0].FOTO) {
            currentFotoUrl = urlFoto[0].FOTO;
            currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;
        }

        // Determinar en qué carpeta debería estar según el ID_PIEZA
        if (/^MGUPTC-CPi-HRR-/.test(ID_PIEZAPARAM)) {
            currentFolderId = id_Carpeta_Drive_HRR;
        } else if (/^MGUPTC-CPi-AFPC-/.test(ID_PIEZAPARAM)) {
            currentFolderId = id_Carpeta_Drive_AFPC;
        } else if (/^MGUPTC-CPi-MJGL-/.test(ID_PIEZAPARAM)) {
            currentFolderId = id_Carpeta_Drive_MJGL;
        } else {
            currentFolderId = id_Carpeta_Drive_Principal;
        }

        if (/^MGUPTC-CPi-HRR-/.test(ID_PIEZA)) {
            newFolderId = id_Carpeta_Drive_HRR;
        } else if (/^MGUPTC-CPi-AFPC-/.test(ID_PIEZA)) {
            newFolderId = id_Carpeta_Drive_AFPC;
        } else if (/^MGUPTC-CPi-MJGL-/.test(ID_PIEZA)) {
            newFolderId = id_Carpeta_Drive_MJGL;
        } else {
            newFolderId = id_Carpeta_Drive_Principal;
        }

        if (req.file) {
            if (currentFileId) {
                await driveServices.deleteFileToDrive(currentFileId);
            }
            FOTO = await driveServices.uploadFileToDrive(req.file, newFolderId, ID_PIEZA);
        } else {
            FOTO = currentFotoUrl;
            if (ID_PIEZA !== ID_PIEZAPARAM) {
                const piezaExistente = await InvestigationModel.findById(ID_PIEZA);
                if (piezaExistente.length > 0) {
                    return res.status(400).json({ error: `El ID_PIEZA: ${ID_PIEZA} ya está en uso` });
                }

                if (currentFileId) {
                    await driveServices.updateFileNameToDrive(currentFileId, ID_PIEZA);

                    // **Mover la imagen a la nueva carpeta si es necesario**
                    if (currentFolderId !== newFolderId) {
                        await driveServices.moveFileToDrive(currentFileId, currentFolderId, newFolderId);
                    }
                }
            }
        }

        const investigacionData = {
            ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
            ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO
        };

        await InvestigationModel.update(ID_PIEZAPARAM, investigacionData);

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'INVESTIGACION_UPDATE',
            ip: req.ip,
            module: 'INVESTIGACION',
            status: 'OK',
            detail: `El usuario: ${usernameAccion} edito los datos de la pieza con id: ${ID_PIEZA}`
        });

        res.status(200).json({ message: `Los datos de la pieza "${ID_PIEZA}" fueron actualizados correctamente` });
    } catch (error) {
        console.error('Error al actualizar investigación:', error.message);
        res.status(500).json({ error: 'Error al actualizar la investigación' });
    }
};

const deleteInvestigation = async (req, res) => {
    const { ID_PIEZA } = req.params;
    const { idPerfilAccion, usernameAccion } = req.body;

    try {
        //Verificar si la pieza existe en la base de datos
        const pieza = await InvestigationModel.findById(ID_PIEZA);
        if (!pieza || pieza.length === 0) {
            return res.status(404).json({ error: `El ID_PIEZA: ${ID_PIEZA} no fue encontrado.` });
        }

        //Obtener la imagen actual desde la BD
        const urlPhoto = await InvestigationModel.getPhoto(ID_PIEZA);
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

        await InvestigationModel.delete(ID_PIEZA);

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'INVESTIGACION_DELETE',
            ip: req.ip,
            module: 'INVESTIGACION',
            status: 'OK',
            detail: `El usuario: ${usernameAccion} elimino los datos de la pieza con id: ${ID_PIEZA}`
        });

        res.status(200).json({ message: `Los datos de la pieza fueron eliminados correctamente` });
    } catch (error) {
        console.error('Error al eliminar investigación:', error.message);
        res.status(500).json({ error: 'Error al eliminar la investigación' });
    }
};

const deleteInvestigationPhoto = async (req, res) => {
    const { ID_PIEZA } = req.params;
    const { idPerfilAccion, usernameAccion } = req.body;

    try {
        const pieza = await InvestigationModel.findById(ID_PIEZA);

        // Obtener la URL de la imagen actual de la pieza desde la base de datos
        const urlFoto = await InvestigationModel.getPhoto(ID_PIEZA);
        let currentFotoUrl = null;
        let currentFileId = null;

        if (urlFoto.length > 0 && urlFoto[0].FOTO) {
            currentFotoUrl = urlFoto[0].FOTO;
            currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;
        }

        if (pieza.length === 0) {
            return res.status(404).json({ error: `El ID de la pieza: ${ID_PIEZA} no fue encontrado` });
        }

        if (!currentFotoUrl) {
            return res.status(400).json({ error: 'La pieza no tiene una imagen asociada' });
        }

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await driveServices.deleteFileToDrive(currentFileId);
        }

        // Actualizar el campo FOTO a NULL en la base de datos
        await InvestigationModel.deletePhoto(ID_PIEZA);

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'INVESTIGACION_IMAGE_DELETE',
            ip: req.ip,
            module: 'INVESTIGACION',
            status: 'OK',
            detail: `El usuario: ${usernameAccion} elimino la imagen de la pieza con id: ${ID_PIEZA}`
        });

        res.status(200).json({ message: `La imagen de la pieza con ID ${ID_PIEZA} fue eliminada correctamente` });
    } catch (error) {
        console.error('Error al eliminar la foto:', error.message);
        res.status(500).json({ error: 'Error al eliminar la imagen de la pieza' });
    }
};

module.exports = { getAllInvestigations, getInvestigationById, createInvestigation, updateInvestigation, deleteInvestigation, deleteInvestigationPhoto };