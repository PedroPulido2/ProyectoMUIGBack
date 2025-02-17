require('dotenv').config();

const Fosil = require('../models/fosilModel');
const driveServices = require('../services/driveServices');
const id_Carpeta_Drive = process.env.ID_CARPETA_DRIVE_FOSIL;

/**
 * Controlador Fosil
 * En este archivo se definen los controladores asociados al manejo de fosiles, se controlan los errores y solicitudes.
 */

const obtenerFosiles = async (req, res) => {
    try {
        const fosiles = await Fosil.obtenerTodosLosFosiles();
        res.status(200).json(fosiles);
    } catch (error) {
        console.error('Error al obtener todas los fosiles:', error.message);
        res.status(500).json({ error: 'Error al obtener los fosiles' });
    }
};

const obtenerFosilPorId = async (req, res) => {
    const { ID_FOSIL } = req.params;
    try {
        const fosil = await Fosil.obtenerFosilPorId(ID_FOSIL);
        if (fosil.length === 0) {
            return res.status(404).json({ error: 'El ID del fosil no existe' });
        }
        res.status(200).json(fosil);
    } catch (error) {
        console.error('Error al obtener todas el fosil:', error.message);
        res.status(500).json({ error: 'Error al obtener el fosil' });
    }
};

const crearFosil = async (req, res) => {
    var FOTO = '';

    const { ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
        FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
        VITRINA, BANDEJA, OBSERVACIONES } = req.body;

    try {
        //Verificar si el ID ya existe en la base de datos
        const fosil = await Fosil.obtenerFosilPorId(ID_FOSIL);

        // Si ya existe, devolver un error sin subir la imagen
        if (fosil.length > 0) {
            return res.status(400).json({ error: 'El ID del fosil ya esta en uso, ingrese uno diferente' });
        }

        //Subir imagen a Google Drive si se selecciono una imagen
        if (req.file) {
            FOTO = await driveServices.subirImagenADrive(req.file, id_Carpeta_Drive);
        }
        const fosilData = {
            ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
            FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
            VITRINA, BANDEJA, OBSERVACIONES, FOTO
        };

        await Fosil.crearFosil(fosilData);
        res.status(201).json({ message: 'Datos del fosil registrados correctamente' });
    } catch (error) {
        console.error('Error al crear el fosil:', error.message);
        res.status(500).json({ error: 'Error al insertar los datos del fosil' });
    }
};

const actualizarFosil = async (req, res) => {
    var FOTO = '';

    const { ID_FOSILPARAM } = req.params;
    const { ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
        FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
        VITRINA, BANDEJA, OBSERVACIONES } = req.body;

    try {
        //Obtener la imagen actual desde la BD
        const urlFoto = await Fosil.obtenerFotoFosil(ID_FOSILPARAM);
        const currentFotoUrl = urlFoto[0].FOTO;
        const currentFileId = currentFotoUrl.split('/d/')[1];

        if (urlFoto.length === 0) {
            return res.status(404).json({ error: `El ID del fósil: ${ID_FOSILPARAM} no fue encontrado u registrado` });
        }

        //Subir imagen a Google Drive si se proporciona un archivo
        if (req.file) {
            if (currentFileId) {
                await driveServices.eliminarImagenDeDrive(currentFileId);
            }
            FOTO = await driveServices.subirImagenADrive(req.file, id_Carpeta_Drive);
        } else {
            FOTO = currentFotoUrl; //Mantener la imagen actual si no se proporciona una nueva

            //Si se cambia el ID_FOSIL entonces el nombre del archivo relacionado tambien cambia
            if (ID_FOSIL !== ID_FOSILPARAM && currentFileId) {
                await driveServices.actualizarNombreImagenDrive(currentFileId, ID_FOSIL);
            }
        }

        const fosilData = {
            ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
            FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
            VITRINA, BANDEJA, OBSERVACIONES, FOTO,
        };

        await Fosil.actualizarFosil(ID_FOSILPARAM, fosilData);
        res.status(200).json({ message: `Los datos del fosil ${ID_FOSIL} fueron actualizados correctamente` });
    } catch (error) {
        console.error('Error al actualizar el fosil:', error.message);
        res.status(500).json({ error: 'Error al actualizar los datos del fosil' });
    }
};

const borrarFosil = async (req, res) => {
    const { ID_FOSIL } = req.params;

    try {
        //Obtener la imagen actual desde la BD
        const urlFoto = await Fosil.obtenerFotoFosil(ID_FOSIL);
        const currentFotoUrl = urlFoto[0].FOTO;
        const currentFileId = currentFotoUrl.split('/d/')[1];

        if (urlFoto.length === 0) {
            return res.status(404).json({ error: `El ID del fósil: ${ID_FOSIL} no fue encontrado` });
        }

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await driveServices.eliminarImagenDeDrive(currentFileId);
        }

        await Fosil.eliminarFosil(ID_FOSIL);
        res.status(200).json({ message: `El fosil fue eliminado correctamente` });
    } catch (error) {
        console.error('Error al eliminar el fosil:', error.message);
        res.status(500).json({ error: 'Error al eliminar los datos del fosil' });
    }
};

const borrarFotoFosil = async (req, res) => {
    const { ID_FOSIL } = req.params;

    try {
        // Obtener la URL de la imagen actual del fósil desde la base de datos
        const rows = await Fosil.obtenerFosilPorId(ID_FOSIL);
        const currentFotoUrl = rows[0].FOTO;
        const currentFileId = currentFotoUrl.split('/d/')[1];

        if (rows.length === 0) {
            return res.status(404).json({ error: `El ID del fósil: ${ID_FOSIL} no fue encontrado` });
        }

        if (!currentFotoUrl) {
            return res.status(400).json({ error: 'El fósil no tiene una imagen asociada' });
        }

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await driveServices.eliminarImagenDeDrive(currentFileId);
        }

        await Fosil.eliminarFotoFosil(ID_FOSIL);
        res.status(200).json({ message: `La imagen del fósil con ID ${ID_FOSIL} fue eliminada correctamente` });
    } catch (error) {
        console.error('Error al eliminar foto del fosil:', error.message);
        res.status(500).json({ error: 'Error al eliminar la imagen del fósil' });
    }
};

module.exports = { obtenerFosiles, obtenerFosilPorId, crearFosil, actualizarFosil, borrarFosil, borrarFotoFosil }