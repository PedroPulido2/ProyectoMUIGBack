const express = require('express');
const router = express.Router();
const rockController = require('../controllers/rockController');
const createUpload = require('../middlewares/upload');
const upload = createUpload('ID_ROCA');
const auth = require('../middlewares/auth');

//Rutas para las rocas
router.get('/', auth, rockController.getAllRocks);
router.get('/:ID_ROCA', auth, rockController.getRockById);
router.post('/', auth, upload.single('FOTO'), rockController.createRock);
router.put('/:ID_ROCAPARAM', auth, upload.single('FOTO'), rockController.updateRock);
router.delete('/:ID_ROCA', auth, rockController.deleteRock);
router.delete('/:ID_ROCA/image', auth, rockController.deleteRockPhoto);

module.exports = router;