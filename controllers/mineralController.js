require('dotenv').config();

const Fosil = require('../models/fosilModel');
const Mineral = require('../models/mineralModel');
const driveServices = require('../services/driveServices');
const id_Carpeta_Drive = process.env.ID_CARPETA_DRIVE_MINERAL;

/**
 * Controlador Minerales
 * En este archivo se definen los controladores asociados al manejo de minerales, se controlan los errores y solicitudes.
 */

const obtenerTodosLosMinerales = async (req, res) => {
    try {
        const minerales = await Mineral.obtenerTodosLosMinerales();
        res.status(200).json(minerales);
    } catch (error) {
        console.error('Error al obtener todos los minerales:', error.message);
        res.status(500).json({ error: 'Error al obtener los minerales' });
    }
};

const obtenerMineralPorId = async (req, res) => {
    const { ID_MINERAL } = req.params;
    try {
        const mineral = await Mineral.obtenerMineralPorId(ID_MINERAL);
        if (mineral.length === 0) {
            return res.status(404).json({ error: 'El ID del mineral no existe' });
        }
        res.status(200).json(mineral);
    } catch (error) {
        console.error('Error al obtener el mineral:', error.message);
        res.status(500).json({ error: 'Error al obtener los minerales' });
    }
};

const crearMineral = async (req, res) => {
    var FOTO = '';

    const { ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
        CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION } = req.body;

    try {
        // Verificar si el ID ya existe en la base de datos
        const mineral = await Mineral.obtenerMineralPorId(ID_MINERAL);

        // Si ya existe, devolver un error sin subir la imagen
        if (mineral.length > 0) {
            return res.status(400).json({ error: 'El id_mineral ya esta en uso, ingrese uno diferente' });
        }

        //Subir imagen a Google Drive
        if (req.file) {
            FOTO = await driveServices.subirImagenADrive(req.file, id_Carpeta_Drive, ID_MINERAL);
        }

        const mineralData = {
            ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
            CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO
        }

        await Mineral.crearMineral(mineralData);
        res.status(201).json({ message: 'Datos del mineral registrados correctamente' });
    } catch (error) {
        console.error('Error al crear el mineral:', error.message);
        res.status(500).json({ error: 'Error al insertar los datos del mineral' });
    }
};

const actualizarMineral = async (req, res) => {
    var FOTO = '';

    const { ID_MINERALPARAM } = req.params;
    const { ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
        CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION } = req.body;

    try {
        const mineral = await Mineral.obtenerMineralPorId(ID_MINERALPARAM);
        //Obtener la imagen actual desde la BD
        const urlFoto = await Mineral.obtenerFotoMineral(ID_MINERALPARAM);
        let currentFotoUrl = null;
        let currentFileId = null;

        if (mineral.length === 0) {
            return res.status(404).json({ error: `El ID del mineral: ${ID_MINERALPARAM} no fue encontrado` });
        }

        if (urlFoto.length > 0 && urlFoto[0].FOTO) {
            currentFotoUrl = urlFoto[0].FOTO;
            currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;
        }

        //Subir imagen a Google Drive si se proporciona un archivo
        if (req.file) {
            const filePath = req.file.path;

            if (currentFileId) {
                await driveServices.eliminarImagenDeDrive(currentFileId);
            }
            FOTO = await driveServices.subirImagenADrive(req.file, id_Carpeta_Drive, ID_MINERAL);
        } else {
            FOTO = currentFotoUrl; //Mantener la imagen actual si no se proporciona una nueva

            //Si se cambia el ID_MINERAL entonces el nombre del archivo relacionado tambien cambia
            if (ID_MINERAL !== ID_MINERALPARAM) {
                const mineralExistente = await Mineral.obtenerMineralPorId(ID_MINERAL);
                if (mineralExistente.length > 0) {
                    return res.status(400).json({ error: `El ID_MINERAL: ${ID_MINERAL} ya está en uso` });
                }
                if (currentFileId) {
                    await driveServices.actualizarNombreImagenDrive(currentFileId, ID_MINERAL);
                }
            }
        }

        const mineralData = {
            ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
            CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO
        }

        await Mineral.actualizarMineral(ID_MINERALPARAM, mineralData);
        res.status(200).json({ message: `Los datos del mineral ${ID_MINERAL} fueron actualizados correctamente` });
    } catch (error) {
        console.error('Error al actualizar el mineral:', error.message);
        res.status(500).json({ error: 'Error al actualizar los datos del mineral' });
    }
};

const borrarMineral = async (req, res) => {
    const { ID_MINERAL } = req.params;

    try {
        //Verificar si el mineral existe en la base de datos
        const mineral = await Mineral.obtenerMineralPorId(ID_MINERAL);
        if (!mineral || mineral.length === 0) {
            return res.status(404).json({ error: `El ID del mineral: ${ID_MINERAL} no fue encontrado.` });
        }
        //Obtener la imagen actual desde la BD
        const urlFoto = await Mineral.obtenerFotoMineral(ID_MINERAL);
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

        await Mineral.eliminarMineral(ID_MINERAL);
        res.status(200).json({ message: `El mineral fue eliminado correctamente` });
    } catch (error) {
        console.error('Error al eliminar el mineral:', error.message);
        res.status(500).json({ error: 'Error al eliminar los datos del mineral' });
    }
};

const borrarImagenMineral = async (req, res) => {
    const { ID_MINERAL } = req.params;

    try {
        const mineral = await Mineral.obtenerMineralPorId(ID_MINERAL);
        // Obtener la URL de la imagen actual de la pieza desde la base de datos
        const urlFoto = await Mineral.obtenerFotoMineral(ID_MINERAL);
        let currentFotoUrl = null;
        let currentFileId = null;

        if (urlFoto.length > 0 && urlFoto[0].FOTO) {
            currentFotoUrl = urlFoto[0].FOTO;
            currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;
        }

        if (mineral.length === 0) {
            return res.status(404).json({ error: `El ID del mineral: ${ID_MINERAL} no fue encontrado` });
        }

        if (!currentFotoUrl) {
            return res.status(400).json({ error: 'El mineral no tiene una imagen asociada' });
        }

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await driveServices.eliminarImagenDeDrive(currentFileId);
        }

        await Mineral.eliminarFotoMineral(ID_MINERAL);
        res.status(200).json({ message: `La imagen del mineral con ID ${ID_MINERAL} fue eliminada correctamente` });
    } catch (error) {
        console.error('Error al eliminar la foto del mineral:', error.message);
        res.status(500).json({ error: 'Error al eliminar la imagen del mineral' });
    }
};

module.exports = { obtenerTodosLosMinerales, obtenerMineralPorId, crearMineral, actualizarMineral, borrarMineral, borrarImagenMineral }