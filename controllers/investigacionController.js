require('dotenv').config();

const Investigacion = require('../models/investigacionModelo');
const driveServices = require('../services/driveServices');
const id_Carpeta_Drive_Principal = process.env.ID_CARPETA_DRIVE_INVESTIGACION;
const id_Carpeta_Drive_AFPC = process.env.ID_CARPETA_DRIVE_INVESTIGACION_AFPC;
const id_Carpeta_Drive_HRR = process.env.ID_CARPETA_DRIVE_INVESTIGACION_HRR;
const id_Carpeta_Drive_MJGL = process.env.ID_CARPETA_DRIVE_INVESTIGACION_MJGL;

/**
 * Controlador Investigacion
 * En este archivo se definen los controladores asociados al manejo de investigaciones, se controlan los errores y solicitudes.
 */

const obtenerInvestigaciones = async (req, res) => {
    try {
        const investigaciones = await Investigacion.obtenerTodasLasInvestigaciones();
        res.status(200).json(investigaciones);
    } catch (error) {
        console.error('Error al obtener todas las investigaciónes:', error.message);
        res.status(500).json({ error: 'Error al obtener las investigaciones' });
    }
};

const obtenerInvestigacionPorId = async (req, res) => {
    const { ID_PIEZA } = req.params;
    try {
        const investigacion = await Investigacion.obteneInvestigacionPorId(ID_PIEZA);
        if (investigacion.length === 0) {
            return res.status(404).json({ error: 'El ID de investigacion no existe' });
        }
        res.status(200).json(investigacion);
    } catch (error) {
        console.error('Error al obtener la investigación:', error.message);
        res.status(500).json({ error: 'Error al obtener los datos de la tabla investigacion' });
    }
};

const crearInvestigacion = async (req, res) => {
    var FOTO = '';

    const { ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
        ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES } = req.body;

    try {
        // Verificar si el ID ya existe en la base de datos
        const investigacion = await Investigacion.obteneInvestigacionPorId(ID_PIEZA);

        // Si ya existe, devolver un error sin subir la imagen
        if (investigacion.length > 0) {
            return res.status(400).json({ error: 'El id_pieza ya esta en uso, ingrese uno diferente' });
        }
        //Subir imagen a Google Drive
        if (req.file) {
            if (/^MGUPTC-CPi-HRR-\d{3}$/.test(ID_PIEZA)) {
                FOTO = await driveServices.subirImagenADrive(req.file, id_Carpeta_Drive_HRR, ID_PIEZA);
            } else if (/^MGUPTC-CPi-AFPC-\d{4}[A-Za-z]?$/.test(ID_PIEZA)) {
                FOTO = await driveServices.subirImagenADrive(req.file, id_Carpeta_Drive_AFPC, ID_PIEZA);
            } else {
                FOTO = await driveServices.subirImagenADrive(req.file, id_Carpeta_Drive_Principal, ID_PIEZA);
            }
        }

        const investigacionData = {
            ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
            ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO
        };

        await Investigacion.crearInvestigacion(investigacionData);
        res.status(201).json({ message: 'Los Datos de la nueva investigacion registrados correctamente' });
    } catch (error) {
        console.error('Error al crear la investigación:', error.message);
        res.status(500).json({ error: 'Error al obtener los datos de la investigación' });
    }
};

const actualizarInformacion = async (req, res) => {
    var FOTO = '';

    const { ID_PIEZAPARAM } = req.params;
    const { ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
        ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES } = req.body;

    try {
        const pieza = await Investigacion.obteneInvestigacionPorId(ID_PIEZAPARAM);
        const urlFoto = await Investigacion.obtenerFotoInvestigacion(ID_PIEZAPARAM);
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
                await driveServices.eliminarImagenDeDrive(currentFileId);
            }
            FOTO = await driveServices.subirImagenADrive(req.file, newFolderId, ID_PIEZA);
        } else {
            FOTO = currentFotoUrl;
            if (ID_PIEZA !== ID_PIEZAPARAM) {
                const piezaExistente = await Investigacion.obteneInvestigacionPorId(ID_PIEZA);
                if (piezaExistente.length > 0) {
                    return res.status(400).json({ error: `El ID_PIEZA: ${ID_PIEZA} ya está en uso` });
                }

                if (currentFileId) {
                    await driveServices.actualizarNombreImagenDrive(currentFileId, ID_PIEZA);
                    
                    // **Mover la imagen a la nueva carpeta si es necesario**
                    if (currentFolderId !== newFolderId) {
                        await driveServices.moverImagenDrive(currentFileId, currentFolderId, newFolderId);
                    }
                }
            }
        }

        const investigacionData = {
            ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
            ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO
        };

        await Investigacion.actualizarInvestigacion(ID_PIEZAPARAM, investigacionData);
        res.status(200).json({ message: `Los datos de la pieza "${ID_PIEZA}" fueron actualizados correctamente` });
    } catch (error) {
        console.error('Error al actualizar investigación:', error.message);
        res.status(500).json({ error: 'Error al actualizar la investigación' });
    }
};

const borrarInvestigacion = async (req, res) => {
    const { ID_PIEZA } = req.params;

    try {
        //Verificar si la pieza existe en la base de datos
        const pieza = await Investigacion.obteneInvestigacionPorId(ID_PIEZA);
        if (!pieza || pieza.length === 0) {
            return res.status(404).json({ error: `El ID_PIEZA: ${ID_FOSIL} no fue encontrado.` });
        }

        //Obtener la imagen actual desde la BD
        const urlFoto = await Investigacion.obtenerFotoInvestigacion(ID_PIEZA);
        let currentFotoUrl = null;
        let currentFileId = null;

        if (urlFoto.length > 0 && urlFoto[0].FOTO) {
            currentFotoUrl = urlFoto[0].FOTO;
            currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;
        }

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await driveServices.eliminarImagenDeDrive(currentFileId);
        }

        await Investigacion.eliminarInvestigacion(ID_PIEZA);
        res.status(200).json({ message: `Los datos de la pieza fueron eliminados correctamente` });
    } catch (error) {
        console.error('Error al eliminar investigación:', error.message);
        res.status(500).json({ error: 'Error al eliminar la investigación' });
    }
};

const borrarImagenInvestigacion = async (req, res) => {
    const { ID_PIEZA } = req.params;

    try {
        const pieza = await Investigacion.obteneInvestigacionPorId(ID_PIEZA);

        // Obtener la URL de la imagen actual de la pieza desde la base de datos
        const urlFoto = await Investigacion.obtenerFotoInvestigacion(ID_PIEZA);
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
            await driveServices.eliminarImagenDeDrive(currentFileId);
        }

        // Actualizar el campo FOTO a NULL en la base de datos
        await Investigacion.eliminarFotoInvestigacion(ID_PIEZA);
        res.status(200).json({ message: `La imagen de la pieza con ID ${ID_PIEZA} fue eliminada correctamente` });
    } catch (error) {
        console.error('Error al eliminar la foto:', error.message);
        res.status(500).json({ error: 'Error al eliminar la imagen de la pieza' });
    }
};

module.exports = { obtenerInvestigaciones, obtenerInvestigacionPorId, crearInvestigacion, actualizarInformacion, borrarImagenInvestigacion, borrarInvestigacion }