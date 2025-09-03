const express = require('express');
const router = express.Router();
const fosilController = require('../controllers/fosilController');
const createUpload = require('../middlewares/upload'); //llamado al middleware to Drive
const upload = createUpload('ID_FOSIL');
const auth = require('../middlewares/auth');

//Rutas de fosiles
router.get('/', auth, fosilController.obtenerFosiles);
router.get('/:ID_FOSIL', auth, fosilController.obtenerFosilPorId);
router.post('/', auth, upload.single('FOTO'), fosilController.crearFosil);
router.put('/:ID_FOSILPARAM', auth, upload.single('FOTO'), fosilController.actualizarFosil);
router.delete('/:ID_FOSIL', auth, fosilController.borrarFosil);
router.delete('/:ID_FOSIL/image', auth, fosilController.borrarFotoFosil);

module.exports = router;