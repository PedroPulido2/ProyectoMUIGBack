const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

//Rutas del login
router.get('/', loginController.getAllLogins);
router.get('/:user', loginController.getLoginByUser);
router.post('/', loginController.createLogin);
router.put('/cPw/:user', loginController.updatePassword);
router.put('/:userParam', loginController.updateLogin);
router.delete('/:user', loginController.deleteLogin);
router.post('/auth', loginController.authUser);
router.post('/verify', loginController.verifyPassword);

module.exports = router;