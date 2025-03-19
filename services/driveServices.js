const drive = require('../config/drive');
const fs = require('fs');
const path = require('path');

/**
 * Subir una imagen a Google Drive
 * @param {Object} file - Objeto del archivo (req.file)
 * @param {String} idCarpetaDrive - ID de la carpeta en Google Drive
 * @param {String} newName - Nuevo nombre para el archivo (sin extensión)
 * @returns {String} - URL de la imagen subida
 */

async function subirImagenADrive(file, idCarpetaDrive, newName) {
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
                parents: [idCarpetaDrive],
            },
            media: {
                mimeType: file.mimetype,
                body: fs.createReadStream(newFilePath), // Aquí se usa newFilePath
            },
        });

        fs.unlinkSync(newFilePath); // Eliminar archivo temporal del servidor

        return `https://drive.google.com/file/d/${response.data.id}`;
    } catch (error) {
        console.error('Error al subir imagen a Google Drive:', error.message);
        throw new Error('Error al subir la imagen');
    }
}

async function eliminarImagenDeDrive(fileId) {
    try {
        if (!fileId) return;
        await drive.files.delete({ fileId });
    } catch (error) {
        console.error('Error al eliminar imagen de Google Drive:', error.message);
        throw new Error('Error al eliminar la imagen');
    }
}

async function actualizarNombreImagenDrive(fileId, newName) {
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
        console.error('Error al actualizar el nombre de la imagen en Google Drive:', error.message);
        throw new Error('Error al actualizar el nombre de la imagen');
    }
}

async function moverImagenDrive(fileId, oldFolderId, newFolderId){
    try {
        // Quitar la imagen de la carpeta anterior
        await drive.files.update({
            fileId: fileId,
            removeParents: oldFolderId,
            addParents: newFolderId,
            fields: 'id, parents'
        });
        console.log(`Imagen ${fileId} movida a la nueva carpeta ${newFolderId}`);
    } catch (error) {
        console.error('Error al mover la imagen en Google Drive:', error.message);
        throw error;
    }
}


module.exports = { subirImagenADrive, eliminarImagenDeDrive, actualizarNombreImagenDrive, moverImagenDrive };
