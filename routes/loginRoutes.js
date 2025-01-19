const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

//Rutas del login
router.get('/', loginController.getAllUsers);
router.get('/:user', loginController.getUserById);
router.post('/', loginController.createNewUser);
router.put('/:userParam', loginController.updateUser);
router.delete('/:user', loginController.deleteUser);
router.post('/auth', loginController.authUser);

module.exports = router;