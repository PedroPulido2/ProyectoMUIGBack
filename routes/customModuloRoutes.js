const express = require('express');
const router = express.Router();
const customModuloController = require('../controllers/customModuloController');
const auth = require('../middlewares/auth');

// Rutas de módulos dinámicos
router.get('/', auth, customModuloController.getAllModules);
router.get('/:id', auth, customModuloController.getModuleById);
router.post('/', auth, customModuloController.createModule);
router.delete('/:id', auth, customModuloController.deleteModule);

router.get('/:id/data', auth, customModuloController.getModuleData);
router.post('/:id/data', auth, customModuloController.createModuleRecord);
router.put('/:id/data/:recordId', auth, customModuloController.updateModuleRecord);
router.delete('/:id/data/:recordId', auth, customModuloController.deleteModuleRecord);

module.exports = router;
