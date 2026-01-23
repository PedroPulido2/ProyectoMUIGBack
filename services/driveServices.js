const drive = require('../config/drive');
const fs = require('fs');
const path = require('path');

/**
 * Subir una imagen a Google Drive
 * @param {Object} file - Objeto del archivo (req.file)
 * @param {String} fileId - ID del archivo en Google Driv
 * @param {String} idDriveFolder - ID de la carpeta en Google Drive
 * @param {String} newName - Nuevo nombre para el archivo (sin extensión)
 * @param {String} oldFolderId - ID de la carpeta antigua (para mover archivos)
 * @param {String} newFolderId - ID de la nueva carpeta (para mover archivos)
 * @returns {String} - URL de la imagen subida
 */

async function uploadFileToDrive(file, idDriveFolder, newName) {
    try {
        const filePath = file.path;
        const originalExtension = path.extname(file.originalname); // Obtener extensión original

        // Evitar extensión duplicada
        const newFileName = newName.endsWith(originalExtension) ? newName : `${newName}${originalExtension}`;
        const newFilePath = path.join(path.dirname(filePath), newFileName);

        // Renombrar archivo antes de subirlo
        fs.renameSync(filePath, newFilePath);

        const response = await drive.files.create({
            requestBody: {
                name: newFileName,
                mimeType: file.mimetype,
                parents: [idDriveFolder],
            },
            media: {
                mimeType: file.mimetype,
                body: fs.createReadStream(newFilePath), // Aquí se usa newFilePath
            },
        });

        fs.unlinkSync(newFilePath); // Eliminar archivo temporal del servidor

        return `https://drive.google.com/file/d/${response.data.id}`;
    } catch (error) {
        console.error('Error al subir archivo a Google Drive:', error.message);
        throw new Error('Error al subir archivo a Google Drive');
    }
}

async function deleteFileToDrive(fileId) {
    try {
        if (!fileId) return;
        await drive.files.delete({ fileId });
    } catch (error) {
        console.error('Error al eliminar archivo de Google Drive:', error.message);
        throw new Error('Error al eliminar el archivo de Google Drive');
    }
}

async function updateFileNameToDrive(fileId, newName) {
    try {
        // Obtener información del archivo para conservar la extensión original
        const fileMetadata = await drive.files.get({
            fileId: fileId,
            fields: 'name',
        });

        const originalName = fileMetadata.data.name;
        const extension = originalName.includes('.') ? originalName.split('.').pop() : '';

        // Añadir la extensión al nuevo nombre, si existe
        const updatedName = extension ? `${newName}.${extension}` : newName;

        // Actualizar el nombre del archivo
        await drive.files.update({
            fileId: fileId,
            requestBody: {
                name: updatedName,
            },
        });
    } catch (error) {
        console.error('Error al actualizar el nombre del archivo en Google Drive:', error.message);
        throw new Error('Error al actualizar el nombre del archivo en Google Drive');
    }
}

async function moveFileToDrive(fileId, oldFolderId, newFolderId) {
    try {
        // Quitar la imagen de la carpeta anterior
        await drive.files.update({
            fileId: fileId,
            removeParents: oldFolderId,
            addParents: newFolderId,
            fields: 'id, parents'
        });
    } catch (error) {
        console.error('Error al mover el archivo en Google Drive:', error.message);
        throw new error;
    }
}

async function protectFileInDrive(fileId) {
    try {
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });
    } catch (error) {
        console.error('Error al proteger el archivo en Google Drive:', error.message);
        throw new error;
    }
}

async function searchFileInDrive(fileName, folderId) {
    try {
        const query = `name = '${fileName}' and '${folderId}' in parents and trashed = false`;
        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (response.data.files.length > 0) {
            return response.data.files[0].id; // Retorna el ID del primer archivo encontrado
        }
        return null; // No existe
    } catch (error) {
        console.error('Error al buscar archivo en Drive:', error.message);
        return null;
    }
}

async function updateFileContent(fileId, filePath, mimeType) {
    try {
        const response = await drive.files.update({
            fileId: fileId,
            media: {
                mimeType: mimeType,
                body: fs.createReadStream(filePath),
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error al actualizar contenido en Drive:', error.message);
        throw new Error('Error al actualizar contenido del archivo');
    }
}

module.exports = { uploadFileToDrive, deleteFileToDrive, updateFileNameToDrive, moveFileToDrive, protectFileInDrive, searchFileInDrive, updateFileContent };
