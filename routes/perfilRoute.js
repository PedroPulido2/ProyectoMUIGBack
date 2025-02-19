const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');
const createUpload = require('../middlewares/upload');
const upload = createUpload('id_Perfil');

router.get('/', perfilController.getAllProfiles);
router.get('/:id_Perfil', perfilController.getProfileById);
router.post('/', upload.single('foto'), perfilController.createProfile);
router.put('/:id_PerfilPARAM', upload.single('foto'), perfilController.updateProfile);
router.delete('/:id_Perfil', perfilController.deleteProfile);
router.delete('/:id_Perfil/image', perfilController.deleteImageProfile);
router.get('/:id_Perfil/image', perfilController.getImageandRolProfile);

module.exports = router;