const express = require('express');
const router = express.Router();
const mineralController = require('../controllers/mineralController');
const createUpload = require('../middlewares/upload');
const upload = createUpload('ID_MINERAL');
const auth = require('../middlewares/auth');

//Rutas de los minerales
router.get('/', auth, mineralController.obtenerTodosLosMinerales);
router.get('/:ID_MINERAL', auth, mineralController.obtenerMineralPorId);
router.post('/', auth, upload.single('FOTO'), mineralController.crearMineral);
router.put('/:ID_MINERALPARAM', auth, upload.single('FOTO'), mineralController.actualizarMineral);
router.delete('/:ID_MINERAL', auth, mineralController.borrarMineral);
router.delete('/:ID_MINERAL/image', auth, mineralController.borrarImagenMineral);

module.exports = router;