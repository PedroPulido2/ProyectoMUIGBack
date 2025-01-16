const multer = require('multer');
const path = require('path');

// Configuración de Multer para almacenar archivos temporalmente en una carpeta específica

const createUpload = (identifierKey) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, './uploads')
        },
        filename: (req, file, cb) => { //renombrar los archivos por el ID respectivo
            const identifier = req.body[identifierKey] || file.originalname;  //toma el identificador del cuerpo de la solicitud
            const ext = path.extname(file.originalname); //obtiene la extension del archivo
            cb(null, `${identifier}${ext}`); //nombra el archivo como identificador + extension
        }
    });

    const fileFilter = (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/; // Extensiones de archivo permitidas
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase()); // Verifica extensión
        const mimetype = fileTypes.test(file.mimetype); // Verifica tipo MIME

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imagenes (jpg, jpeg, png, gif)'));
        }
    };


    return multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: { fileSize: 15 * 1024 * 1024 }  //tamaño maximo de la imagen 15Mb
    });

};

module.exports = createUpload;