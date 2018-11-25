const express = require('express');
const router = express.Router();
const fs = require('fs-extra');

router.post('/', (req) => {
	console.log('start the file System: remove file...' + JSON.stringify(req.body));
	return fs.removeSync(req.body.filePath);
});

module.exports = router;
