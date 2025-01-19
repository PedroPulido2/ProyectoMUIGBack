const express = require('express');
const router = express.Router();
const mineralController = require('../controllers/mineralController');
const createUpload = require('../middlewares/upload');
const upload = createUpload('ID_MINERAL');
const id_Carpeta_Drive = '1a0dUrckJ94wYICyNS_tvj3-DUcf75O9f';

//Rutas de los minerales
router.get('/', mineralController.obtenerTodosLosMinerales);
router.get('/:ID_MINERAL', mineralController.obtenerMineralPorId);
router.post('/', upload.single('FOTO'), mineralController.crearMineral);
router.put('/:ID_MINERALPARAM', upload.single('FOTO'), mineralController.actualizarMineral);
router.delete('/:ID_MINERAL', mineralController.borrarMineral);
router.delete('/:ID_MINERAL/image', mineralController.borrarImagenMineral);

module.exports = router;