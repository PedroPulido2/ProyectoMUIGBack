const express = require('express');
const router = express.Router();
const imagenController = require('../controllers/imagenController');

router.get('/load/:imageId',imagenController.obtenerImagen);

module.exports = router;
