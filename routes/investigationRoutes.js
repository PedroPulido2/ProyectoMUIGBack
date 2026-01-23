const express = require('express');
const router = express.Router();
const investigationController = require('../controllers/investigationController');
const createUpload = require('../middlewares/upload');
const upload = createUpload('ID_PIEZA');
const auth = require('../middlewares/auth');

//Rutas de investigacion
router.get('/', auth, investigationController.getAllInvestigations);
router.get('/:ID_PIEZA', auth, investigationController.getInvestigationById);
router.post('/', auth, upload.single('FOTO'), investigationController.createInvestigation);
router.put('/:ID_PIEZAPARAM', auth, upload.single('FOTO'), investigationController.updateInvestigation);
router.delete('/:ID_PIEZA', auth, investigationController.deleteInvestigation);
router.delete('/:ID_PIEZA/image', auth, investigationController.deleteInvestigationPhoto);

module.exports = router;