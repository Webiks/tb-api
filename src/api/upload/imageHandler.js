const exif = require('exif-parser');
const exiftool = require('exiftool');
const moment = require('moment');
const { createNewLayer } = require('../databaseCrud/DbUtils');
const { getFootprint, getBboxFromPoint } = require('../ansyn/getGeoData');

// upload files to the File System
class ImageHandler {

	static getImageData(worldId, reqFiles, name, path, fields, buffer) {
		let files = reqFiles.length ? reqFiles : [reqFiles];
		console.log('starting to uploadFile to FS...');
		console.log('uploadFile to FS files: ' + JSON.stringify(files));
		console.log('uploadFile to FS fields: ' + JSON.stringify(fields));

		if (files.length !== 0) {
			// 1. move the image file into the directory in the name of its id
			const images = files.map(file => {
				// 1. set the file Data from the upload file
				const fileData = setFileData(file);
				console.log('1. set FileData: ' + JSON.stringify(fileData));

				// 2. set the world-layer data
				// let worldLayer = setLayerFields(file._id, fileData, displayUrl, filePath);
				let worldLayer = setLayerFields(file._id, fileData, file.filePath);
				console.log('2. worldLayer include Filedata: ' + JSON.stringify(worldLayer));

				// 3. get the metadata of the image file
				console.log('3. metadata imageData thumbnailUrl: ' + file.imageData.thumbnailUrl);
				return getMetadata(worldLayer, file.encodePathName, buffer, file.imageData.thumbnailUrl)
					.then(metadata => {
						console.log(`3. include Metadata: ${JSON.stringify(metadata)}`);

						// 4. set the geoData of the image file
						const geoData = setGeoData({ ...metadata });
						console.log(`4. include Geodata: ${JSON.stringify(geoData)}`);

						// 5. set the inputData of the image file
						const inputData = setInputData({ ...geoData });
						const newFile = { ...inputData };
						console.log(`5. include Inputdata: ${JSON.stringify(newFile)}`);

						// 6. save the file to mongo database and return the new file is succeed
						return createNewLayer(newFile, worldId)
							.then(newLayer => {
								console.log('createNewLayer result: ' + newLayer);
								return newLayer;
							})
							.catch(error => {
								console.error('ERROR createNewLayer: ', error);
								return null;
							});
					})
					.catch(error => {
						console.log(error);
						return null;
					});
			});

			return Promise.all(images);

		} else {
			console.log('there ara no files to upload!');
			return [];
		}
		// ============================================= Private Functions =================================================
		// set the File Data from the ReqFiles
		function setFileData(file) {
			return {
				name: file.name,
				size: file.size,
				fileUploadDate: file.fileUploadDate,
				fileExtension: file.fileExtension,
				filePath: file.filePath,
				fileType: 'image',
				encodeFileName: file.encodeFileName,
				splitPath: null
			};
		}

		// set the world-layer main fields
		function setLayerFields(id, file, filePath) {
			const name = (file.name).split('.')[0];

			return {
				_id: id,
				name,
				fileName: file.name,
				displayUrl: filePath,
				filePath,
				fileType: 'image',
				format: 'JPEG',
				fileData: file
			};
		}

		// get the metadata of the image file
		function getMetadata(file, filePath, buffer, thumbnailUrl) {
			let imageData = file.imageData;
			console.log(`start get Metadata...${JSON.stringify(imageData)}`);
			const parser = exif.create(buffer);

			// 1. get the image's MetaData from the exif-parser
			const result = parser.parse();
			const {
				Make, Model,
				GPSLatitudeRef, GPSLatitude, GPSLongitudeRef, GPSLongitude, GPSAltitude,
				ExifImageWidth, ExifImageHeight
			} = result.tags;

			// 2. get the image's MetaData from the exif-tool
			return new Promise((resolve, reject) => {
				exiftool.metadata(buffer, function (err, results) {
					if (err) {
						console.log(`ERROR exiftool: ${err}`);
						reject(err);
					}

					// convert the results to an object
					let metadata = {};
					Object.entries(results).forEach((entry) => {
						const key = entry[0];
						const value = entry[1];
						metadata[key] = value;
					});
					console.log('metadata object:', JSON.stringify(metadata));

					// convert the 'fieldOfView' to a number
					metadata.fieldOfView = parseFloat(metadata.fieldOfView.split(' ')[0]);
					console.log(`fieldOfView: ${metadata.fieldOfView}, type: ${typeof metadata.fieldOfView}`);

					const {
						relativeAltitude, fieldOfView,
						pitch, yaw, roll,
						cameraPitch, cameraYaw, cameraRoll,
						gimbalRollDegree, gimbalYawDegree, gimbalPitchDegree,
						flightRollDegree, flightYawDegree, flightPitchDegree,
						camReverse, gimbalReverse,
						modifyDate, ['date/timeOriginal']: dateTimeOriginal, createDate
					} = metadata;

					// format the dates
					const exifDateFormat = 'YYYY:MM:DD hh:mm:ss';

					imageData = {
						Make, Model,
						GPSLatitudeRef, GPSLatitude, GPSLongitudeRef, GPSLongitude, GPSAltitude,
						ExifImageWidth, ExifImageHeight,
						relativeAltitude, fieldOfView,
						pitch, yaw, roll,
						cameraPitch, cameraYaw, cameraRoll,
						gimbalRollDegree, gimbalYawDegree, gimbalPitchDegree,
						flightRollDegree, flightYawDegree, flightPitchDegree,
						camReverse, gimbalReverse,
						modifyDate: moment(modifyDate, exifDateFormat).toString(),
						dateTimeOriginal: moment(dateTimeOriginal, exifDateFormat).toString(),
						createDate: moment(createDate, exifDateFormat).toString(),
						thumbnailUrl
					};

					// set the Date's fields in the layer's model
					file.fileData.fileCreatedDate = imageData.createDate;
					file.createdDate = Date.parse((file.fileData.fileCreatedDate));

					resolve({ ...file, imageData });
				});
			});
		}

		// set the geoData from the image GPS
		function setGeoData(layer) {
			// set the center point and the droneCenter (the same point, for now)
			const centerPoint = [layer.imageData.GPSLongitude || 0, layer.imageData.GPSLatitude || 0];
			const droneCenter = centerPoint;
			console.log('setGeoData center point: ', JSON.stringify(centerPoint));
			// get the Bbox
			const bbox = getBboxFromPoint(centerPoint, 200);
			console.log('setGeoData polygon: ', JSON.stringify(bbox));
			// get the footprint
			const footprint = getFootprint(bbox);
			console.log('setGeoData footprint: ', JSON.stringify(footprint));
			// set the geoData
			const geoData = { droneCenter, footprint, centerPoint, bbox };
			console.log('setGeoData: ', JSON.stringify(geoData));
			return { ...layer, geoData };
		}

		function setInputData(layer) {
			return {
				...layer,
				inputData: {
					name: layer.fileData.name,
					sensor: {
						type: fields.sensorType,
						name: fields.sensorName || layer.imageData.Model,
						maker: layer.imageData.Make,
						bands: []
					},
					tb: {
						affiliation: 'UNKNOWN',
						GSD: 0,
						flightAltitude: layer.imageData.GPSAltitude,
						cloudCoveragePercentage: 0
					},
					ansyn: {
						title: fields.title || ''
					}
				}
			};
		}
	}
}

module.exports = ImageHandler;
