const express = require('express');
const router = express.Router();
const dbWorlds = require('./databaseCrud/dbWorlds');
const dbLayers = require('./databaseCrud/dbLayers');
const uploadRouter = require('./upload/uploadRouter');
const fileSystem = require('./fs/fileSystem');
const ansyn = require('./ansyn/index');

router.use('/dbworlds', dbWorlds);
router.use('/dblayers', dbLayers);
router.use('/upload', uploadRouter);
router.use('/fs', fileSystem);
router.use('/ansyn', ansyn);

module.exports = router;
