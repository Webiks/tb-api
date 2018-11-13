const express = require('express');
const router = express.Router();
const uploadFiles = require('../upload/uploadFiles');

router.use('/upload', uploadFiles);

module.exports = router;
