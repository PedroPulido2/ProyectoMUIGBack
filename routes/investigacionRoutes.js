const express = require('express');
const router = express.Router();
const investigacionController = require('../controllers/investigacionController');
const createUpload = require('../middlewares/upload');
const upload = createUpload('ID_PIEZA');
const auth = require('../middlewares/auth');

//Rutas de investigacion
router.get('/', auth, investigacionController.obtenerInvestigaciones);
router.get('/:ID_PIEZA', auth, investigacionController.obtenerInvestigacionPorId);
router.post('/', auth, upload.single('FOTO'), investigacionController.crearInvestigacion);
router.put('/:ID_PIEZAPARAM', auth, upload.single('FOTO'), investigacionController.actualizarInformacion);
router.delete('/:ID_PIEZA', auth, investigacionController.borrarInvestigacion);
router.delete('/:ID_PIEZA/image', auth, investigacionController.borrarImagenInvestigacion);

module.exports = router;