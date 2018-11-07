const express = require('express');
const router = express.Router();
const formidable = require('express-formidable');
const uploadUtils = require('./uploadUtils');
require('../fs/fileMethods')();

router.use(formidable(opts));

router.post('/:worldId', uploadUtils.uploadFiles);

module.exports = router;
