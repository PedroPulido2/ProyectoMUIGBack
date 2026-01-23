const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');

router.get('/load/:imageId',photoController.getPhoto);
router.get('/wm/load/:imageId',photoController.getPhotoWatermark);

module.exports = router;
