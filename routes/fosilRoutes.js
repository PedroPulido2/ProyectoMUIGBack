const express = require('express');
const router = express.Router();
const fosilController = require('../controllers/fosilController');
const createUpload = require('../middlewares/upload'); //llamado al middleware to Drive
const upload = createUpload('ID_FOSIL');

//Rutas de fosiles
router.get('/', fosilController.obtenerFosiles); 
router.get('/:ID_FOSIL', fosilController.obtenerFosilPorId);
router.post('/', upload.single('FOTO'), fosilController.crearFosil);
router.put('/:ID_FOSILPARAM', upload.single('FOTO'), fosilController.actualizarFosil);
router.delete('/:ID_FOSIL', fosilController.borrarFosil);
router.delete('/:ID_FOSIL/image', fosilController.borrarFotoFosil);

module.exports = router;