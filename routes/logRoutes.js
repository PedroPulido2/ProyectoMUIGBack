const express = require("express");
const logger = require("../middlewares/logger.js");
const router = express.Router();
const auth = require('../middlewares/auth');

router.get("/", auth, logger.getLogs);
router.post("/upload", auth, logger.uploadLogToDrive);

module.exports = router;
