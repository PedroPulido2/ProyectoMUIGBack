const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

//Rutas del login
router.get('/', loginController.getAllLogins);
router.get('/:user', loginController.getLoginByUser);
router.post('/', loginController.createLogin);
router.put('/:userParam', loginController.updateLogin);
router.delete('/:user', loginController.deleteLogin);
router.post('/auth', loginController.authUser);

module.exports = router;