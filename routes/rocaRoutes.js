const express = require('express');
const router = express.Router();
const rocaController = require('../controllers/rocaController');
const createUpload = require('../middlewares/upload');
const upload = createUpload('ID_ROCA');

//Rutas para las rocas
router.get('/', rocaController.obtenerTodasLasRocas);
router.get('/:ID_ROCA', rocaController.obtenerRocaPorId);
router.post('/', upload.single('FOTO'), rocaController.crearRoca);
router.put('/:ID_ROCAPARAM', upload.single('FOTO'), rocaController.actualizarRoca);
router.delete('/:ID_ROCA', rocaController.eliminarRoca);
router.delete('/:ID_ROCA/image', rocaController.eliminarFotoRoca);

module.exports = router;