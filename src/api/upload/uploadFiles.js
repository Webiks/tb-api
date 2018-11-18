const express = require('express');
const router = express.Router();
const formidable = require('express-formidable');
const { uploadPath, uploadFiles } = require('./uploadUtils');
const { getOptions } = require('../fs/fileMethods');

router.use(formidable(getOptions(uploadPath)));
router.post('/', uploadFiles);
router.post('/:worldId', uploadFiles);

module.exports = router;
