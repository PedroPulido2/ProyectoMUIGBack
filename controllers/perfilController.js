require('dotenv').config();
const bcrypt = require('bcrypt');

const Perfil = require('../models/perfilModel');
const driveServices = require('../services/driveServices');
const Login = require('../models/loginModel');
const id_Carpeta_Drive = process.env.ID_CARPETA_PERFIL;

/**
 * Controlador Perfiles
 * En este archivo se definen los controladores asociados al manejo de perfiles, se controlan los errores y solicitudes.
 */

const getAllProfiles = async (req, res) => {
    try {
        const perfiles = await Perfil.getAllProfiles();
        res.status(200).json(perfiles);
    } catch (error) {
        console.error('Error al obtener todos los perfiles:', error.message);
        res.status(500).json({ error: 'Error al obtener los perfiles' });
    }
};

const getProfileById = async (req, res) => {
    const { id_Perfil } = req.params;
    try {
        const perfil = await Perfil.getProfileById(id_Perfil);
        if (perfil.length === 0) {
            return res.status(404).json({ error: 'El ID del perfil no existe' });
        }
        res.status(200).json(perfil);
    } catch (error) {
        console.error('Error al obtener todos los perfiles:', error.message);
        res.status(500).json({ error: 'Error al obtener los perfiles' });
    }
};

const createProfile = async (req, res) => {
    var foto = '';
    const { id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, user, password, isAdmin } = req.body;

    try {
        //Verificar si el ID ya existe en la base de datos
        const perfil = await Perfil.getProfileById(id_Perfil);

        // Si ya existe, devolver un error sin subir la imagen
        if (perfil.length > 0) {
            return res.status(400).json({ error: 'El numero de documento del perfil ya esta en uso, ingrese uno diferente' });
        }

        //Se verifica si el user existe en la tabla login
        const userExist = await Login.getLoginByUser(user);
        if (userExist.length > 0) {
            return res.status(400).json({ error: 'El nombre de usuario ya esta en uso' });
        }

        //Subir imagen a Google Drive si se selecciono una imagen
        if (req.file) {
            foto = await driveServices.subirImagenADrive(req.file, id_Carpeta_Drive);
        }
        const perfilData = {
            id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo,
            telefono, foto, isAdmin
        };

        //llamo metodo para crear contraseña encriptada
        const hashedPassword = await generateHashedPassword(password);

        //Realiza la subida de los datos
        await Perfil.createProfile(perfilData);
        await Login.createLogin(user, hashedPassword, id_Perfil);

        res.status(201).json({ message: 'Datos del perfil fueron registrados correctamente' });
    } catch (error) {
        console.error('Error al crear el perfil:', error.message);
        res.status(500).json({ error: 'Error al insertar los datos del perfil' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { id_PerfilPARAM } = req.params;
        const { id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, user, password, isAdmin } = req.body;
        let foto = '';

        // Obtener la imagen actual desde la BD
        const urlFoto = await Perfil.getImageProfile(id_PerfilPARAM);

        // Verificar si el perfil existe antes de acceder a los datos
        if (!urlFoto.length) {
            return res.status(404).json({ error: `El número de documento del perfil: ${id_PerfilPARAM} no fue encontrado o registrado` });
        }

        const currentFotoUrl = urlFoto[0].foto || '';
        const currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;
        // Subir nueva imagen si se proporciona
        if (req.file) {
            if (currentFileId) {
                await driveServices.eliminarImagenDeDrive(currentFileId);
            }
            foto = await driveServices.subirImagenADrive(req.file, id_Carpeta_Drive);
        } else {
            foto = currentFotoUrl;
            if (id_Perfil !== id_PerfilPARAM && currentFileId) {
                await driveServices.actualizarNombreImagenDrive(currentFileId, id_Perfil);
            }
        }

        // Verificar si el usuario ya existe en la tabla login
        const userExist = await Login.getLoginByUser(user);
        if (userExist.length > 0 && userExist[0].user !== user) {
            return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
        }

        // Encriptar contraseña solo si se proporciona
        const hashedPassword = password ? await generateHashedPassword(password) : null;

        // Datos del perfil a actualizar
        const perfilData = { id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, foto, isAdmin };

        // Actualizar datos en la BD
        if (hashedPassword) {
            await Login.updateLogin(user, hashedPassword, id_Perfil);
        }
        await Perfil.updateProfile(id_PerfilPARAM, perfilData);

        res.status(201).json({ message: 'Datos del perfil fueron actualizados correctamente' });

    } catch (error) {
        console.error('Error al actualizar el perfil:', error.message);
        res.status(500).json({ error: 'Error al actualizar los datos del perfil' });
    }
};


const deleteProfile = async (req, res) => {
    const { id_Perfil } = req.params;

    try {
        //Obtener la imagen actual desde la BD
        const urlFoto = await Perfil.getImageProfile(id_Perfil);
        const currentFotoUrl = urlFoto[0].foto;
        const currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;

        if (urlFoto.length === 0) {
            return res.status(404).json({ error: `El numero de documento del perfil: ${id_Perfil} no fue encontrado u registrado` });
        }

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await driveServices.eliminarImagenDeDrive(currentFileId);
        }

        const dataUser = await Login.getLoginByIdPerfil(id_Perfil);
        const user = dataUser[0].user;

        await Login.deleteLogin(user);
        await Perfil.deleteProfile(id_Perfil);
        res.status(200).json({ message: `El perfil fue eliminado correctamente` });
    } catch (error) {
        console.error('Error al eliminar el perfil:', error.message);
        res.status(500).json({ error: 'Error al eliminar los datos del perfil' });
    }
};

const deleteImageProfile = async (req, res) => {
    const { id_Perfil } = req.params;

    try {
        // Obtener la URL de la imagen actual del perfil desde la base de datos
        const urlFoto = await Perfil.getProfileById(id_Perfil);
        const currentFotoUrl = urlFoto[0].foto;
        const currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;

        if (urlFoto.length === 0) {
            return res.status(404).json({ error: `El numero de documento del perfil: ${id_Perfil} no fue encontrado u registrado` });
        }

        if (!currentFotoUrl) {
            return res.status(400).json({ error: 'El perfil no tiene una imagen asociada' });
        }

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await driveServices.eliminarImagenDeDrive(currentFileId);
        }

        await Perfil.deleteImageProfile(id_Perfil);
        res.status(200).json({ message: `La imagen del perfil con numero de documento: ${id_Perfil} fue eliminada correctamente` });
    } catch (error) {
        console.error('Error al eliminar foto del perfil:', error.message);
        res.status(500).json({ error: 'Error al eliminar la foto del perfil' });
    }
};

const getImageandRolProfile = async (req, res) => {
    try {
        const { id_Perfil } = req.params;

        const rol = await Perfil.getProfileById(id_Perfil);
        const urlFoto = await Perfil.getImageProfile(id_Perfil);
        const currentFotoUrl = urlFoto[0].foto;

        res.status(200).json({ fotoProfile: currentFotoUrl, isAdmin: rol[0].isAdmin });
    } catch (error) {
        console.error('Error al obtener la foto del perfil:', error.message);
        res.status(500).json({ error: 'Error al obtener la foto del perfil' });
    }
};

const generateHashedPassword = async (password) => {
    // Generar un salt para cifrar la contraseña
    const salt = await bcrypt.genSalt(10);
    if (!salt) {
        throw new Error('No se pudo generar el salt para cifrar la contraseña');
    }

    // Generar el hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, salt);
    if (!hashedPassword) {
        throw new Error('No se pudo generar el hash de la contraseña');
    }
    return hashedPassword;
};

module.exports = { getAllProfiles, getProfileById, createProfile, updateProfile, deleteProfile, deleteImageProfile, getImageandRolProfile }