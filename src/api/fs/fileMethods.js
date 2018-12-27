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

const findFileTypeAndSource = (reqType, sensorType) => {
	const extension = (reqType).split('/')[1].toLowerCase();
	let sourceType = null;
	let fileType;

	if (sensorType) {
		const sensor = sensorType.toLowerCase();
		// find the source type
		if (sensor.includes('mobile')) {
			sourceType = 'mobile';
		}
		else if (sensor.includes('drone')) {
			sourceType = 'drone';
		}
		else if (sensor.includes('satellite')) {
			sourceType = 'satellite';
		}
		// find the file type
		if (sensor.includes('geotiff')) {
			fileType = 'raster';
		}
		else if (sensor.includes('imagery')) {
			fileType = 'image';
		}
	} else {
		// find the file type
		if (extension.includes('tif')) {
			fileType = 'raster';
		}
		else if (extension === 'jpg' || extension === 'jpeg') {
			fileType = 'image';
		}	else {
			fileType = 'vector';
		}
	}

	return {
		fileType,
		sourceType
	};
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

module.exports = { getOptions, findFileTypeAndSource, createDirSync };
