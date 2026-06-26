const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const createUpload = require('../middlewares/upload');
const upload = createUpload('id_Perfil');
const auth = require('../middlewares/auth');

router.get('/', auth, profileController.getAllProfiles);
router.get('/:id_Perfil', auth, profileController.getProfileById);
router.post('/', upload.single('foto'), profileController.createProfile);
router.put('/:id_PerfilPARAM', auth, upload.single('foto'), profileController.updateProfile);
router.put('/:id_Perfil/permissions', auth, profileController.updatePermissionsProfile);
router.delete('/:id_Perfil', auth, profileController.deleteProfile);
router.delete('/:id_Perfil/image', auth, profileController.deleteProfilePhoto);
router.get('/:id_Perfil/image', auth, profileController.getImageandRolProfile);

module.exports = router;