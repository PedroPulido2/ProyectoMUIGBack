const express = require('express');
const router = express.Router();
const rocaController = require('../controllers/rocaController');
const createUpload = require('../middlewares/upload');
const upload = createUpload('ID_ROCA');
const auth = require('../middlewares/auth');

//Rutas para las rocas
router.get('/', auth, rocaController.obtenerTodasLasRocas);
router.get('/:ID_ROCA', auth, rocaController.obtenerRocaPorId);
router.post('/', auth, upload.single('FOTO'), rocaController.crearRoca);
router.put('/:ID_ROCAPARAM', auth, upload.single('FOTO'), rocaController.actualizarRoca);
router.delete('/:ID_ROCA', auth, rocaController.eliminarRoca);
router.delete('/:ID_ROCA/image', auth, rocaController.eliminarFotoRoca);

module.exports = router;