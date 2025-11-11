const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');
const auth = require('../middlewares/auth');

//Rutas del login
router.get('/', loginController.getAllLogins);
router.get('/:user', loginController.getLoginByUser);
router.post('/', loginController.createLogin);
router.put('/cPw/:user', auth, loginController.updatePassword);
router.put('/:userParam', auth, loginController.updateLogin);
router.delete('/:user', auth, loginController.deleteLogin);
router.post('/auth', loginController.authUser);
router.post('/verify', loginController.verifyPassword);
router.post('/logout/:user', auth, loginController.logoutUser);
router.post('/unlock/:user', auth, loginController.unlockUser);

module.exports = router;