const express = require('express');
const router = express.Router();
const imagenController = require('../controllers/imagenController');

router.get('/load/:imageId',imagenController.obtenerImagen);
router.get('/wm/load/:imageId',imagenController.obtenerImagenMarcaAgua);

module.exports = router;
