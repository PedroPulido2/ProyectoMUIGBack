const express = require('express');
const router = express.Router();
const mineralController = require('../controllers/mineralController');
const createUpload = require('../middlewares/upload');
const upload = createUpload('ID_MINERAL');
const auth = require('../middlewares/auth');

//Rutas de los minerales
router.get('/', auth, mineralController.getAllMinerals);
router.get('/:ID_MINERAL', auth, mineralController.getMineralById);
router.post('/', auth, upload.single('FOTO'), mineralController.createMineral);
router.put('/:ID_MINERALPARAM', auth, upload.single('FOTO'), mineralController.updateMineral);
router.delete('/:ID_MINERAL', auth, mineralController.deleteMineral);
router.delete('/:ID_MINERAL/image', auth, mineralController.deleteMineralPhoto);

module.exports = router;