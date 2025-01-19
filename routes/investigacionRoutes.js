const express = require('express');
const router = express.Router();
const investigacionController = require('../controllers/investigacionController');
const createUpload = require('../middlewares/upload');
const upload = createUpload('ID_PIEZA');

//Rutas de investigacion
router.get('/', investigacionController.obtenerInvestigaciones);
router.get('/:ID_PIEZA', investigacionController.obtenerInvestigacionPorId);
router.post('/', upload.single('FOTO'), investigacionController.crearInvestigacion);
router.put('/:ID_PIEZAPARAM', upload.single('FOTO'), investigacionController.actualizarInformacion);
router.delete('/:ID_PIEZA', investigacionController.borrarInvestigacion);
router.delete('/:ID_PIEZA/image', investigacionController.borrarImagenInvestigacion);

module.exports = router;