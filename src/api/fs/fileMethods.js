const fs = require('fs-extra');
const { upload } = require('../../../config/config');

const getOptions = (uploadPath) => ({
	encoding: 'utf-8',
	maxFileSize: upload.maxFileSize,
	uploadDir: uploadPath,
	multiples: true, // req.files to be arrays of files
	keepExtensions: true
});

const getFileTypeData = (reqType, sensorType) => {
	let sourceType = null;
	let fileType;
	let format = (reqType).split('/')[1].toUpperCase();

	// find the source type
	if (sensorType) {
		const sensor = sensorType.toLowerCase();
		if (sensor.includes('mobile')) {
			sourceType = 'mobile';
		}
		else if (sensor.includes('drone')) {
			sourceType = 'drone';
		}
		else if (sensor.includes('satellite')) {
			sourceType = 'satellite';
		}
	}

	// find the file type and format
	if (reqType.includes('image/')) {
		if (reqType.includes('tiff')) {
			fileType = 'raster';
			format = 'GEOTIFF';
		}
		else {
			fileType = 'image';
		}
	}
	else {
		fileType = 'vector';
		format = 'SHAPEFILE';
	}

	console.log(`find sourceType: ${sourceType}`);

	return {
		fileType,
		sourceType,
		format
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

module.exports = { getOptions, getFileTypeData, createDirSync };
