const express = require('express');
const router = express.Router();
const formidable = require('express-formidable');
const { uploadPath, uploadFiles } = require('./uploadUtils');
require('../fs/fileMethods')();

router.use(formidable(getOptions(uploadPath)));
router.post('/', uploadFiles);

module.exports = router;
