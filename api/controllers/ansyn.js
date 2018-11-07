'use strict';
const { uploadFiles } = require('../../old/src/api/upload/uploadUtils');

module.exports = {
	uploadImage
};

function uploadImage(req, res) {
	req.params.worldId = req.swagger.params.worldId.value;
	console.log(req.swagger.params.worldId.value);
	req.files = { uploads: req.files.file };
	uploadFiles(req, res);
}
