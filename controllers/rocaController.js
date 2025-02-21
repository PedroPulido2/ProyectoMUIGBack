require('dotenv').config();

const Roca = require('../models/rocaModel');
const driveServices = require('../services/driveServices');
const id_Carpeta_Drive = process.env.ID_CARPETA_DRIVE_ROCAS;

/**
 * Controlador Roca
 * En este archivo se definen los controladores asociados al manejo de rocas, se controlan los errores y solicitudes.
 */

const obtenerTodasLasRocas = async (req, res) => {
    try {
        const rocas = await Roca.obtenerTodasLasRocas();
        res.status(200).json(rocas);
    } catch (error) {
        console.error('Error al obtener todas las rocas:', error.message);
        res.status(500).json({ error: 'Error al obtener las rocas' });
    }
};

const obtenerRocaPorId = async (req, res) => {
    const { ID_ROCA } = req.params;
    try {
        const roca = await Roca.obtenerRocaPorId(ID_ROCA);
        if (roca.length === 0) {
            return res.status(404).json({ error: 'El ID de la roca no existe' });
        }
        res.status(200).json(roca);
    } catch (error) {
        console.error('Error al obtener la roca:', error.message);
        res.status(500).json({ error: 'Error al obtener la roca' });
    }
};

const crearRoca = async (req, res) => {
    var FOTO = '';

    const { ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
        MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION } = req.body;

    try {
        // Verificar si el ID ya existe en la base de datos
        const roca = await Roca.obtenerRocaPorId(ID_ROCA);

        // Si ya existe, devolver un error sin subir la imagen
        if (roca.length > 0) {
            return res.status(400).json({ error: 'El id_roca ya esta en uso, ingrese uno diferente' });
        }

        //Subir imagen a Google Drive
        if (req.file) {
            FOTO = await driveServices.subirImagenADrive(req.file, id_Carpeta_Drive);
        }

        const rocaData = {
            ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
            MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO
        }

        await Roca.crearRoca(rocaData);
        res.status(201).json({ message: 'Datos de la roca registrados correctamente' });
    } catch (error) {
        console.error('Error al registrar la roca:', error.message);
        res.status(500).json({ error: 'Error al insertar los datos de la roca' });
    }
};

const actualizarRoca = async (req, res) => {
    var FOTO = '';

    const { ID_ROCAPARAM } = req.params;
    const { ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
        MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION } = req.body;

    try {
        //Obtener la imagen actual desde la BD
        const urlFoto = await Roca.obtenerFotoRoca(ID_ROCAPARAM);
        const currentFotoUrl = urlFoto[0].FOTO;
        const currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;

        if (urlFoto.length === 0) {
            return res.status(404).json({ error: `El ID de la roca: ${ID_ROCA} no fue encontrado` });
        }

        //Subir imagen a Google Drive si se proporciona un archivo
        if (req.file) {
            if (currentFileId) {
                await driveServices.eliminarImagenDeDrive(currentFileId);
            }
            FOTO = await driveServices.subirImagenADrive(req.file, id_Carpeta_Drive);
        } else {
            FOTO = currentFotoUrl; //Mantener la imagen actual si no se proporciona una nueva

            //Si se cambia el ID_ROCA entonces el nombre del archivo relacionado tambien cambia
            if (ID_ROCA !== ID_ROCAPARAM && currentFileId) {
                await driveServices.actualizarNombreImagenDrive(currentFileId, ID_ROCA);
            }
        }

        const rocaData = {
            ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
            MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO, ID_ROCAPARAM
        }

        await Roca.actualizarRoca(ID_ROCAPARAM, rocaData);
        res.status(200).json({ message: `Los datos de la roca ${ID_ROCA} fueron actualizados correctamente` });
    } catch (error) {
        console.error('Error al actualizar la roca:', error.message);
        res.status(500).json({ error: 'Error al actualizar los datos de la roca' });
    }
};

const eliminarRoca = async (req, res) => {
    const { ID_ROCA } = req.params;

    try {
        //Obtener la imagen actual desde la BD
        const urlFoto = await Roca.obtenerFotoRoca(ID_ROCA);
        const currentFotoUrl = urlFoto[0].FOTO;
        const currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;

        if (urlFoto.length === 0) {
            return res.status(404).json({ error: `El ID de la roca: ${ID_ROCA} no fue encontrado` });
        }

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await driveServices.eliminarImagenDeDrive(currentFileId);
        }

        await Roca.eliminarRoca(ID_ROCA);
        res.status(200).json({ message: `La roca fue eliminado correctamente` });
    } catch (error) {
        console.error('Error al eliminar la roca:', error.message);
        res.status(500).json({ error: 'Error al eliminar los datos de la roca' });
    }
};

const eliminarFotoRoca = async (req, res) => {
    const { ID_ROCA } = req.params;

    try {
        // Obtener la URL de la imagen actual de la pieza desde la base de datos
        const urlFoto = await Roca.obtenerFotoRoca(ID_ROCA);
        const currentFotoUrl = urlFoto[0].FOTO;
        const currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;

        if (urlFoto.length === 0) {
            return res.status(404).json({ error: `El ID de la roca: ${ID_ROCA} no fue encontrado` });
        }

        if (!currentFotoUrl) {
            return res.status(400).json({ error: 'La roca no tiene una imagen asociada' });
        }

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await driveServices.eliminarImagenDeDrive(currentFileId);
        }

        await Roca.eliminarFotoRoca(ID_ROCA);
        res.status(200).json({ message: `La imagen de la roca con ID ${ID_ROCA} fue eliminada correctamente` });
    } catch (error) {
        console.error('Error al eliminar la foto de la roca:', error.message);
        res.status(500).json({ error: 'Error al eliminar la imagen de la roca' });
    }
};

module.exports = { obtenerTodasLasRocas, obtenerRocaPorId, crearRoca, actualizarRoca, eliminarRoca, eliminarFotoRoca }