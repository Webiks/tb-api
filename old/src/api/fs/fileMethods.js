const fs = require('fs-extra');
const path = require('path');
const { uploadPath } = require('../upload/uploadUtils');
require('../../config/serverConfig')();
const configParams = config().configParams;

module.exports = function () {

	this.opts = {
		encoding: 'utf-8',
		maxFileSize: configParams.maxFileSize,
		uploadDir: uploadPath,
		multiples: true, // req.files to be arrays of files
		keepExtensions: true
	};

	this.findFileType = (reqType) => {
		const extension = (reqType).split('/')[1].toLowerCase();
		if (extension.includes('tif')) {
			return 'raster';
		}
		else if (extension === 'jpg' || extension === 'jpeg') {
			return 'image';
		}
		else {
			return 'vector';
		}
	};

	// this.createDir = (targetDir, opts) => {
	this.createDir = (dirPath) => {
		console.log('start creating a directory...');
		console.log(`createDir: dir path = ${dirPath}`);
		try {
			fs.mkdirSync(dirPath);
			console.log(`Directory ${dirPath} created!`);
		} catch (err) {
			if (err.code === 'EEXIST') { // dirPath already exists!
				console.log(`Directory ${dirPath} already exists!`);
				return dirPath;
			} else {
				console.log(`error occured trying to make Directory ${dirPath}! - ${err}`);
			}
		}
	};
};
