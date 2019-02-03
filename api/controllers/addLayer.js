const sensorTypes = require('../swagger/config/paths/layer/sensorTypes');
const droneImagery = require('./addLayer/droneImagery');

// const getFileTypeData = (reqType, sensorType) => {
// 	let sourceType = null;
// 	let fileType;
// 	let format = (reqType).split('/')[1].toUpperCase();
//
// 	// find the source type
// 	if (sensorType) {
// 		const sensor = sensorType.toLowerCase();
// 		if (sensor.includes('mobile')) {
// 			sourceType = 'mobile';
// 		}
// 		else if (sensor.includes('drone')) {
// 			sourceType = 'drone';
// 		}
// 		else if (sensor.includes('satellite')) {
// 			sourceType = 'satellite';
// 		}
// 	}
//
// 	// find the file type and format
// 	if (reqType.includes('image/')) {
// 		if (reqType.includes('tiff')) {
// 			fileType = 'raster';
// 			format = 'GEOTIFF';
// 		}
// 		else {
// 			fileType = 'image';
// 		}
// 	}
// 	else {
// 		fileType = 'vector';
// 		format = 'SHAPEFILE';
// 	}
//
// 	console.log(`find sourceType: ${sourceType}`);
//
// 	return {
// 		fileType,
// 		sourceType,
// 		format
// 	};
// };
//
//
//
//
// function uploadImageNew(req, res) {
// 	const fields = {};
//
// 	Object.entries(req.swagger.params).forEach(([key, value]) => {
// 		fields[key] = value.value;
// 	});
//
// 	let {
// 		file,
// 		sharing,
// 		sensorType
// 	} = fields;
//
// 	file = JSON.parse(JSON.stringify(file));
//
// 	let worldId = (sharing || upload.defaultWorldId).toLowerCase();
// 	let tempPaths = [];
// 	const { fileType, sourceType, format } = getFileTypeData(file.type, sensorType);
// 	file = setBeforeUpload(file, typeData, uploadPath, fields);
// 	let name = file.encodeFileName;
// 	let path = uploadPath + name;
// 	tempPaths[0] = path;
//
// 	uploadHandler(res, worldId, file, path, tempPaths, typeData.sourceType);
// }
//
// function uploadHandler(res, worldId, file, path, tempPaths, sourceType) {
// 	const name = file.encodeFileName;
//
// 	if (file.fileType === 'image') {
// 		// get all the image data and save it in mongo Database
// 		getImageData(worldId, file, name, path, sourceType)
// 			.then(files => res.send(returnFiles(files, path, tempPaths)));
// 	} else {
// 		// upload the file to GeoServer and save all the data in mongo Database
// 		geoserverHandle.getGeoserverData(worldId, file, name, path).then(
// 			files => res.send(returnFiles(files, path, tempPaths)));
// 	}
// }
//
// function setBeforeUpload(file, typeData, uploadPath, fields) {
// 	console.log('start setBeforeUpload ...');
// 	const name = file.name;
// 	// set the user's input fields
// 	let sensorType = null;
// 	let sensorName = null;
// 	let description = null;
// 	let creditName = null;
// 	if (fields) {
// 		sensorType = fields.sensorType ? fields.sensorType : null;
// 		sensorName = fields.sensorName ? fields.sensorName : null;
// 		description = fields.description ? fields.description : null;
// 		creditName = fields.creditName ? fields.creditName : null;
// 	}
// 	const inputData = {
// 		name,
// 		flightAltitude: 0,
// 		cloudCoveragePercentage: 0.1,
// 		sensor: {
// 			type: sensorType,
// 			name: sensorName
// 		},
// 		ansyn: {
// 			description,
// 			creditName
// 		},
// 		// TB app's user field
// 		tb: {
// 			affiliation: 'UNKNOWN',
// 			GSD: 0
// 		},
// 		ol: {
// 			zoom: 14,
// 			opacity: 0.6
// 		}
// 	};
//
// 	// replace '/' to '_' in the file name
// 	if (name.indexOf('/') !== -1) {
// 		name.replace('/\//g', '_');
// 	}
//
// 	const encodeFileName = encodeURIComponent(name);
// 	const filePath = uploadPath + encodeFileName;
// 	const fileExtension = name.substring(name.lastIndexOf('.')).toLowerCase();
//
// 	const newFile = {
// 		_id: uuid.v4(),
// 		name,													// file name (include the extension)
// 		size: file.size,
// 		fileUploadDate: new Date(file.mtime).toISOString(),
// 		fileType: typeData.fileType,
// 		format: typeData.format,
// 		fileExtension,
// 		filePath,
// 		encodeFileName,
// 		inputData
// 	};
//
// 	// renaming the file full path (according to the encoded name)
// 	fs.renameSync(file.path, newFile.filePath);
//
// 	return newFile;
// }

const addLayer = async (req, res) => {
	const fields = {};
	Object.entries(req.swagger.params).forEach(([key, value]) => {
		fields[key] = value.value;
	});

	let result;
	try {
		switch (fields.sensorType) {
			case sensorTypes.DroneImagery:
				result = await droneImagery(fields);
				break;
			case sensorTypes.Mobile:
				break;

			case sensorTypes.DroneMap:
				break;

			case sensorTypes.Satellite:
				break;
		}
		res.json(result)
	} catch (err) {
		res.status(500).json({ error: err.message, _error: err })
	}
};

module.exports = {
	addLayer
};
