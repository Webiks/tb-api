const fs = require('fs-extra');
const { upload } = require('../../../config/config');

const getOptions = (uploadPath) => {
	console.log('start getOptions... ', uploadPath);
	return {
		encoding: 'utf-8',
		maxFileSize: upload.maxFileSize,
		uploadDir: uploadPath,
		multiples: true, // req.files to be arrays of files
		keepExtensions: true
	};
};

const findFileType = (reqType) => {
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

const createDirSync = (dirPath) => {
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

module.exports = { getOptions, findFileType, createDirSync };
