require('dotenv').config();
const bcrypt = require('bcrypt');

const profileModel = require('../models/profileModel');
const driveServices = require('../services/driveServices');
const loginModel = require('../models/loginModel');
const id_Carpeta_Drive = process.env.ID_CARPETA_PERFIL;
const { logEvent } = require('../middlewares/logger');

/**
 * Controlador Perfiles
 * En este archivo se definen los controladores asociados al manejo de perfiles, se controlan los errores y solicitudes.
 */

const getAllProfiles = async (req, res) => {
    try {
        const perfiles = await profileModel.getAll();
        res.status(200).json(perfiles);
    } catch (error) {
        console.error('Error al obtener los perfiles:', error.message);
        res.status(500).json({ error: 'Error al obtener los perfiles' });
    }
};

const getProfileById = async (req, res) => {
    const { id_Perfil } = req.params;
    try {
        const perfil = await profileModel.getById(id_Perfil);
        if (perfil.length === 0) {
            return res.status(404).json({ error: 'El ID del perfil no existe' });
        }
        res.status(200).json(perfil);
    } catch (error) {
        console.error('Error al obtener los perfiles:', error.message);
        res.status(500).json({ error: 'Error al obtener los perfiles' });
    }
};

const createProfile = async (req, res) => {
    var foto = '';
    const { id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, user, password, isAdmin, idPerfilAccion, usernameAccion } = req.body;

    try {
        //Verificar si el ID ya existe en la base de datos
        const perfil = await profileModel.getById(id_Perfil);

        // Si ya existe, devolver un error sin subir la imagen
        if (perfil.length > 0) {
            return res.status(400).json({ error: 'El numero de documento del perfil ya esta en uso, ingrese uno diferente' });
        }

        //Se verifica si el user existe en la tabla login
        const userExist = await loginModel.getByUser(user);
        if (userExist.length > 0) {
            return res.status(400).json({ error: 'El nombre de usuario ya esta en uso' });
        }

        //Subir imagen a Google Drive si se selecciono una imagen
        if (req.file) {
            foto = await driveServices.uploadFileToDrive(req.file, id_Carpeta_Drive, id_Perfil);
        }
        const perfilData = {
            id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo,
            telefono, foto, isAdmin
        };

        //llamo metodo para crear contraseña encriptada
        const hashedPassword = await generateHashedPassword(password);

        //Realiza la subida de los datos
        await profileModel.create(perfilData);
        await loginModel.create(user, hashedPassword, id_Perfil);

        if (typeof usernameAccion !== 'undefined' && usernameAccion !== null) {
            await logEvent({
                id_user: idPerfilAccion,
                user: usernameAccion,
                activity: 'PROFILE_CREATE',
                ip: req.ip,
                module: 'PERFIL',
                status: 'OK',
                detail: `El usuario: ${usernameAccion} registro la cuenta del usuario ${user}`
            });
        } else {
            await logEvent({
                id_user: id_Perfil,
                user: user,
                activity: 'PROFILE_CREATE',
                ip: req.ip,
                module: 'PERFIL',
                status: 'OK',
                detail: `Se registro la cuenta del usuario ${user}`
            });
        }

        res.status(201).json({ message: 'Datos del perfil fueron registrados correctamente' });
    } catch (error) {
        console.error('Error al insertar los datos del perfil:', error.message);
        res.status(500).json({ error: 'Error al insertar los datos del perfil' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { id_PerfilPARAM } = req.params;
        const { id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, user, password, isAdmin, estado, idPerfilAccion, usernameAccion } = req.body;
        let foto = '';

        const idPerfilData = await loginModel.getByIdPerfil(id_PerfilPARAM);
        const estadoAnterior = idPerfilData[0].estado;

        const perfil = await profileModel.getById(id_PerfilPARAM);
        const isAdminAnterior = perfil[0].isAdmin;

        // Obtener la imagen actual desde la BD
        const urlFoto = await profileModel.getImage(id_PerfilPARAM);

        // Verificar si el perfil existe antes de acceder a los datos
        if (!urlFoto.length) {
            return res.status(404).json({ error: `El número de documento del perfil: ${id_PerfilPARAM} no fue encontrado o registrado` });
        }

        const currentFotoUrl = urlFoto[0].foto || '';
        const currentFileId = currentFotoUrl.split('/d/')[1]?.split('/')[0] || null;
        // Subir nueva imagen si se proporciona
        if (req.file) {
            if (currentFileId) {
                await driveServices.deleteFileToDrive(currentFileId);
            }
            foto = await driveServices.uploadFileToDrive(req.file, id_Carpeta_Drive, id_Perfil);
        } else {
            foto = currentFotoUrl;
            if (id_Perfil !== id_PerfilPARAM && currentFileId) {
                await driveServices.updateFileNameToDrive(currentFileId, id_Perfil);
            }
        }

        // Verificar si el usuario ya existe en la tabla login
        const userExist = await loginModel.getByIdPerfil(id_PerfilPARAM);

        if (userExist[0].user !== user && user) {
            await loginModel.updateUser(user, id_Perfil);
        }

        if (password && password.trim() !== '') {
            const hashedPassword = await generateHashedPassword(password);
            await loginModel.updatePassword(user, hashedPassword);

            if (typeof usernameAccion !== 'undefined' && usernameAccion !== null) {
                await logEvent({
                    id_user: idPerfilAccion,
                    user: usernameAccion,
                    activity: 'PROFILE_CHANGE_PASSWORD',
                    ip: req.ip,
                    module: 'PERFIL',
                    status: 'OK',
                    detail: `El usuario: ${usernameAccion} cambio la contraseña de la cuenta del usuario: ${user}`
                });
            } else {
                await logEvent({
                    id_user: id_Perfil,
                    user: user,
                    activity: 'PROFILE_CHANGE_PASSWORD',
                    ip: req.ip,
                    module: 'PERFIL',
                    status: 'OK',
                    detail: `El usuario: ${user} cambio su contraseña`
                });
            }
        }

        // Datos del perfil a actualizar
        const perfilData = { id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, foto, isAdmin };

        await profileModel.update(id_PerfilPARAM, perfilData);

        if (estado && estado !== estadoAnterior) {
            if (estado === 'BLOQUEADO') {
                await loginModel.blockuser(user);
                await logEvent({
                    id_user: idPerfilAccion,
                    user: usernameAccion,
                    activity: 'PROFILE_BLOCK',
                    ip: req.ip,
                    module: 'PERFIL',
                    status: 'OK',
                    detail: `El usuario: ${usernameAccion} bloqueó la cuenta del usuario: ${user}`
                });
            } else if (estado === 'ACTIVO') {
                await loginModel.unlockUser(user);
                await logEvent({
                    id_user: idPerfilAccion,
                    user: usernameAccion,
                    activity: 'PROFILE_UNLOCK',
                    ip: req.ip,
                    module: 'PERFIL',
                    status: 'OK',
                    detail: `El usuario: ${usernameAccion} desbloqueo la cuenta del usuario: ${user}`
                });
            }
        }

        if (typeof usernameAccion !== 'undefined' && usernameAccion !== null && typeof user !== 'undefined' && user !== null) {
            await logEvent({
                id_user: idPerfilAccion,
                user: usernameAccion,
                activity: 'PROFILE_UPDATE',
                ip: req.ip,
                module: 'PERFIL',
                status: 'OK',
                detail: `El usuario: ${usernameAccion} edito los datos de la cuenta del usuario: ${user}`
            });
        } else {
            await logEvent({
                id_user: id_Perfil,
                user: usernameAccion,
                activity: 'PROFILE_UPDATE',
                ip: req.ip,
                module: 'PERFIL',
                status: 'OK',
                detail: `El usuario: ${usernameAccion} edito sus datos personales`
            });
        }

        if (isAdmin && isAdmin !== isAdminAnterior) {
            if (isAdmin === '2') {
                await logEvent({
                    id_user: idPerfilAccion,
                    user: usernameAccion,
                    activity: 'PROFILE_SET_ADMIN',
                    ip: req.ip,
                    module: 'PERFIL',
                    status: 'OK',
                    detail: `El usuario: ${usernameAccion} otorgó privilegios de administrador a la cuenta del usuario: ${user}`
                });
            } else if (isAdmin === '1') {
                await logEvent({
                    id_user: idPerfilAccion,
                    user: usernameAccion,
                    activity: 'PROFILE_SET_NORMAL',
                    ip: req.ip,
                    module: 'PERFIL',
                    status: 'OK',
                    detail: `El usuario: ${usernameAccion} removió privilegios de administrador a la cuenta del usuario: ${user}`
                });
            } else if (isAdmin === '3') {
                await logEvent({
                    id_user: idPerfilAccion,
                    user: usernameAccion,
                    activity: 'PROFILE_SET_SUPERADMIN',
                    ip: req.ip,
                    module: 'PERFIL',
                    status: 'OK',
                    detail: `El usuario: ${usernameAccion} otorgó privilegios de superadministrador a la cuenta del usuario: ${user}`
                });
            }
        }

        res.status(200).json({ message: 'Datos del perfil fueron actualizados correctamente' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: `El usuario ya está en uso` });
        }
        console.error('Error al actualizar el perfil:', error.message);
        res.status(500).json({ error: 'Error al actualizar los datos del perfil' });
    }
};

const updatePermissionsProfile = async (req, res) => {

    try {
        const { id_Perfil } = req.params;
        const { perm_fosil, perm_mineral, perm_roca, perm_investigacion, perm_perfil, usernameAccion, idPerfilAccion } = req.body;

        const perfilPermissions = { perm_fosil, perm_mineral, perm_roca, perm_investigacion, perm_perfil };

        await profileModel.updatePermissions(id_Perfil, perfilPermissions);
        res.status(200).json({ message: 'Permisos actualizados correctamente' });

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'PROFILE_PERMISSIONS_UPDATE',
            ip: req.ip,
            module: 'PERFIL',
            status: 'OK',
            detail: `El usuario: ${usernameAccion} actualizó los permisos del perfil: ${id_Perfil}`
        });

    } catch (error) {
        console.error('Error al actualizar los permisos:', error.message);
        res.status(500).json({ error: 'Error al actualizar los permisos' });
    }
};

const deleteProfile = async (req, res) => {
    const { id_Perfil } = req.params;
    const { idPerfilAccion, usernameAccion } = req.body;

    try {
        //Obtener la imagen actual desde la BD
        const urlPhoto = await profileModel.getImage(id_Perfil);
        const currentUrlPhoto = urlPhoto[0].foto;
        const currentFileId = currentUrlPhoto.split('/d/')[1]?.split('/')[0] || null;

        if (urlPhoto.length === 0) {
            return res.status(404).json({ error: `El numero de documento del perfil: ${id_Perfil} no fue encontrado u registrado` });
        }

        // Eliminar la imagen de Google Drive
        if (currentFileId) {
            await driveServices.deleteFileToDrive(currentFileId);
        }

        const dataUser = await loginModel.getByIdPerfil(id_Perfil);
        const user = dataUser[0].user;

        await loginModel.delete(user);
        await profileModel.delete(id_Perfil);

        if (usernameAccion !== user) {
            await logEvent({
                id_user: idPerfilAccion,
                user: usernameAccion,
                activity: 'PROFILE_DELETE',
                ip: req.ip,
                module: 'PERFIL',
                status: 'OK',
                detail: `El usuario: ${usernameAccion} eliminó la cuenta del usuario: ${user}`
            });
        } else {
            await logEvent({
                id_user: id_Perfil,
                user: user,
                activity: 'PROFILE_DELETE',
                ip: req.ip,
                module: 'PERFIL',
                status: 'OK',
                detail: `El usuario: ${user} eliminó su cuenta`
            });
        }

        res.status(200).json({ message: `El perfil fue eliminado correctamente` });
    } catch (error) {
        console.error('Error al eliminar los datos del perfil:', error.message);
        res.status(500).json({ error: 'Error al eliminar los datos del perfil' });
    }
};

const deleteProfilePhoto = async (req, res) => {
    const { id_Perfil } = req.params;
    const { idPerfilAccion, usernameAccion } = req.body;

    try {
        // Obtener la URL de la imagen actual del perfil desde la base de datos
        const urlFoto = await profileModel.getById(id_Perfil);
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
            await driveServices.deleteFileToDrive(currentFileId);
        }

        await profileModel.deleteImage(id_Perfil);

        if (idPerfilAccion !== id_Perfil) {
            await logEvent({
                id_user: idPerfilAccion,
                user: usernameAccion,
                activity: 'PROFILE_IMAGE_DELETE',
                ip: req.ip,
                module: 'PERFIL',
                status: 'OK',
                detail: `El usuario: ${usernameAccion} eliminó la foto de la cuenta del usuario: ${id_Perfil}`
            });
        } else {
            await logEvent({
                id_user: id_Perfil,
                user: usernameAccion,
                activity: 'PROFILE_IMAGE_DELETE',
                ip: req.ip,
                module: 'PERFIL',
                status: 'OK',
                detail: `El usuario: ${id_Perfil} eliminó la foto de perfil`
            });
        }

        res.status(200).json({ message: `La imagen del perfil con numero de documento: ${id_Perfil} fue eliminada correctamente` });
    } catch (error) {
        console.error('Error al eliminar foto del perfil:', error.message);
        res.status(500).json({ error: 'Error al eliminar la foto del perfil' });
    }
};

const getImageandRolProfile = async (req, res) => {
    try {
        const { id_Perfil } = req.params;

        const rol = await profileModel.getById(id_Perfil);
        const urlPhoto = await profileModel.getImage(id_Perfil);
        const currentUrlPhoto = urlPhoto[0].foto;

        res.status(200).json({ fotoProfile: currentUrlPhoto, isAdmin: rol[0].isAdmin });
    } catch (error) {
        console.error('Error al obtener la foto del perfil:', error.message);
        res.status(500).json({ error: 'Error al obtener la foto del perfil' });
    }
};

const generateHashedPassword = async (password) => {
    // Generar un salt para cifrar la contraseña
    if (!password) throw new Error("La contraseña no puede estar vacía");

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

module.exports = { getAllProfiles, getProfileById, createProfile, updateProfile, updatePermissionsProfile, deleteProfile, deleteProfilePhoto, getImageandRolProfile }