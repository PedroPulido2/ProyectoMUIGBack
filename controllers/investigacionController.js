require('dotenv').config();

const Investigacion = require('../models/investigacionModelo');
const driveServices = require('../services/driveServices');
const id_Carpeta_Drive_Principal = process.env.ID_CARPETA_DRIVE_INVESTIGACION;
const id_Carpeta_Drive_AFPC = process.env.ID_CARPETA_DRIVE_INVESTIGACION_AFPC;
const id_Carpeta_Drive_HRR = process.env.ID_CARPETA_DRIVE_INVESTIGACION_HRR;

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
                FOTO = await driveServices.subirImagenADrive(req.file, id_Carpeta_Drive_HRR);
            } else if (/^MGUPTC-CPi-AFPC-\d{4}[A-Za-z]?$/.test(ID_PIEZA)) {
                FOTO = await driveServices.subirImagenADrive(req.file, id_Carpeta_Drive_AFPC);
            } else {
                FOTO = await driveServices.subirImagenADrive(req.file, id_Carpeta_Drive_Principal);
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
        //Obtener la imagen actual desde la BD
        const urlFoto = await Investigacion.obtenerFotoInvestigacion(ID_PIEZAPARAM);
        const currentFotoUrl = urlFoto[0].FOTO;
        const currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;

        if (urlFoto.length === 0) {
            return res.status(404).json({ error: `El ID de la pieza: ${ID_PIEZAPARAM} no fue encontrado` });
        }

        //Subir imagen a Google Drive si se proporciona un archivo
        if (req.file) {
            if (currentFileId) {
                await driveServices.eliminarImagenDeDrive(currentFileId);
            }
            if (/^MGUPTC-CPi-HRR-\d{3}$/.test(ID_PIEZA)) {
                FOTO = await driveServices.subirImagenADrive(req.file, id_Carpeta_Drive_HRR);
            } else if (/^MGUPTC-CPi-AFPC-\d{4}[A-Za-z]?$/.test(ID_PIEZA)) {
                FOTO = await driveServices.subirImagenADrive(req.file, id_Carpeta_Drive_AFPC);
            } else {
                FOTO = await driveServices.subirImagenADrive(req.file, id_Carpeta_Drive_Principal);
            }
        } else {
            FOTO = currentFotoUrl; //Mantener la imagen actual si no se proporciona una nueva

            //Si se cambia el ID_PIEZA entonces el nombre del archivo relacionado tambien cambia
            if (ID_PIEZA !== ID_PIEZAPARAM && currentFileId) {
                await driveServices.actualizarNombreImagenDrive(currentFileId, ID_PIEZA);
            }
        }

        const investigacionData = {
            ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
            ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO
        }

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
        //Obtener la imagen actual desde la BD
        const urlFoto = await Investigacion.obtenerFotoInvestigacion(ID_PIEZA);
        const currentFotoUrl = urlFoto[0].FOTO;
        const currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;

        if (urlFoto.length === 0) {
            return res.status(404).json({ error: `El ID de la pieza: ${ID_PIEZA} no fue encontrado` });
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
        // Obtener la URL de la imagen actual de la pieza desde la base de datos
        const urlFoto = await Investigacion.obtenerFotoInvestigacion(ID_PIEZA);
        const currentFotoUrl = urlFoto[0].FOTO;
        const currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;
        if (urlFoto.length === 0) {
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