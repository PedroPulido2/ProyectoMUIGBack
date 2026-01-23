const express = require('express');
const router = express.Router();
const fossilController = require('../controllers/fossilController');
const createUpload = require('../middlewares/upload'); //llamado al middleware to Drive
const upload = createUpload('ID_FOSIL');
const auth = require('../middlewares/auth');

//Rutas de fosiles
router.get('/', auth, fossilController.getAllFossils);
router.get('/:ID_FOSIL', auth, fossilController.getFossilById);
router.post('/', auth, upload.single('FOTO'), fossilController.createFossil);
router.put('/:ID_FOSILPARAM', auth, upload.single('FOTO'), fossilController.updateFossil);
router.delete('/:ID_FOSIL', auth, fossilController.deleteFossil);
router.delete('/:ID_FOSIL/image', auth, fossilController.deleteFossilPhoto);

module.exports = router;