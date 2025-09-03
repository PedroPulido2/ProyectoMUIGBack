const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');
const createUpload = require('../middlewares/upload');
const upload = createUpload('id_Perfil');
const auth = require('../middlewares/auth');

router.get('/', auth, perfilController.getAllProfiles);
router.get('/:id_Perfil', auth, perfilController.getProfileById);
router.post('/', upload.single('foto'), auth, perfilController.createProfile);
router.put('/:id_PerfilPARAM', auth, upload.single('foto'), perfilController.updateProfile);
router.delete('/:id_Perfil', auth, perfilController.deleteProfile);
router.delete('/:id_Perfil/image', auth, perfilController.deleteImageProfile);
router.get('/:id_Perfil/image', auth, perfilController.getImageandRolProfile);

module.exports = router;