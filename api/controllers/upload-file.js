/*
const { upload } = require('../../config/config');
const { getFileTypeData } = require('../../src/api/fs/fileMethods');
const getImageData = require('../../src/api/upload/getImageData');
const uploadPath = `${__dirname.replace(/\\/g, '/')}/public/uploads/`;

function uploadImageNew(req, res) {
	let file = JSON.parse(JSON.stringify(req.files.uploads));
	let { fields } = req;
	let worldId = (fields.sharing || upload.defaultWorldId).toLowerCase();
	let sensorType = fields.sensorType;
	let tempPaths = [];
	const typeData = getFileTypeData(file.type, sensorType);
	file = setBeforeUpload(file, typeData, uploadPath, fields);
	let name = file.encodeFileName;
	let path = uploadPath + name;
	tempPaths[0] = path;

	uploadHandler(res, worldId, file, name, path, tempPaths, typeData.sourceType);
}

// send to the right upload handler according to the type
function uploadHandler(res, worldId, reqFiles, name, path, tempPaths, sourceType) {
	if (reqFiles.fileType === 'image') {
		// get all the image data and save it in mongo Database
		getImageData(worldId, reqFiles, name, path, sourceType)
			.then(files => res.send(returnFiles(files, path, tempPaths)));
	} else {
		// upload the file to GeoServer and save all the data in mongo Database
		geoserverHandle.getGeoserverData(worldId, reqFiles, name, path).then(
			files => res.send(returnFiles(files, path, tempPaths)));
	}
}

function setBeforeUpload(file, typeData, uploadPath, fields) {
	console.log('start setBeforeUpload ...');
	const name = file.name;
	// set the user's input fields
	let sensorType = null;
	let sensorName = null;
	let description = null;
	let creditName = null;
	if (fields) {
		sensorType = fields.sensorType ? fields.sensorType : null;
		sensorName = fields.sensorName ? fields.sensorName : null;
		description = fields.description ? fields.description : null;
		creditName = fields.creditName ? fields.creditName : null;
	}
	const inputData = {
		name,
		flightAltitude: 0,
		cloudCoveragePercentage: 0.1,
		sensor: {
			type: sensorType,
			name: sensorName
		},
		ansyn: {
			description,
			creditName
		},
		// TB app's user field
		tb: {
			affiliation: 'UNKNOWN',
			GSD: 0
		},
		ol: {
			zoom: 14,
			opacity: 0.6
		}
	};

	// replace '/' to '_' in the file name
	if (name.indexOf('/') !== -1) {
		name.replace('/\//g', '_');
	}

	const encodeFileName = encodeURIComponent(name);
	const filePath = uploadPath + encodeFileName;
	const fileExtension = name.substring(name.lastIndexOf('.')).toLowerCase();

	const newFile = {
		_id: uuid.v4(),
		name,													// file name (include the extension)
		size: file.size,
		fileUploadDate: new Date(file.mtime).toISOString(),
		fileType: typeData.fileType,
		format: typeData.format,
		fileExtension,
		filePath,
		encodeFileName,
		inputData
	};

	// renaming the file full path (according to the encoded name)
	fs.renameSync(file.path, newFile.filePath);

	return newFile;
}
*/

function uploadImage(req, res) {
	console.log('uploadImage controller req BODY: ', req.body);
	console.log('uploadImage controller req FILES uploads: ', req.files.uploads);
	res.json({ message: 'Not implemented yet' });
}

module.exports = {
	uploadImage
};
