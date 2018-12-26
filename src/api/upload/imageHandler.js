const exif = require('exif-parser');
const exiftool = require('exiftool');
const moment = require('moment');
const { ansyn } = require('../../../config/config');
const { createNewLayer } = require('../databaseCrud/DbUtils');
const getGeoDataFromPoint = require('../ansyn/getGeoData');
const getDroneGeoData = require('../ansyn/getDroneGeoData');

// upload files to the File System
class ImageHandler {

	static getImageData(worldId, reqFiles, name, path, buffer, sourceType) {
		let files = reqFiles.length ? reqFiles : [reqFiles];
		console.log('starting to uploadFile to FS...');

		if (files.length !== 0) {
			// 1. move the image file into the directory in the name of its id
			const images = files.map(file => {
				// 1. set the file Data from the upload file
				const fileData = setFileData(file);
				console.log('1. set FileData: ' + JSON.stringify(fileData));

				// 2. set the world-layer data
				let worldLayer = setWorldLayer(file, file._id, fileData, file.filePath, file.thumbnailUrl);
				console.log('2. worldLayer include Filedata: ', JSON.stringify(worldLayer));

				// 3. get the metadata of the image file
				return getMetadata(worldLayer, file.encodePathName, buffer)
					.then(metadata => {
						console.log(`3. include Metadata: ${JSON.stringify(metadata)}`);
						// 4. set the geoData of the image file
						const geoData = setGeoData({ ...metadata });
						console.log(`4. include Geodata: ${JSON.stringify(geoData)}`);

						// 5. set the inputData of the image file
						const inputData = setInputData({ ...geoData });
						const newFile = { ...inputData };
						console.log(`5. include Inputdata: ${JSON.stringify(newFile)}`);

						// 6. get the real footprint of the Drone's image from cesium (for Drone's images only)
						if (sourceType === 'drone') {
							return getDroneGeoData(newFile)
								.then(savedFile => {
									console.log(`5. include Drone-data: ${JSON.stringify(savedFile)}`);
									// 7. save the file to mongo database and return the new layer is succeed
									return createNewLayer(savedFile, worldId)
										.then(savedFile => saveDataToDB(savedFile));
								});
						} else {
							return saveDataToDB(newFile);
						}
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
		// save all the image date in mongo Database and return the new layer is succeed
		function saveDataToDB(savedFile) {
			return createNewLayer(savedFile, worldId)
				.then(newLayer => {
					console.log('createNewLayer OK!');
					return newLayer;
				})
				.catch(error => {
					console.error('ERROR createNewLayer: ', error);
					return null;
				});
		}

		// set the File Data from the ReqFiles
		function setFileData(file) {
			return {
				name: file.name,
				size: file.size,
				fileUploadDate: file.fileUploadDate,
				fileExtension: file.fileExtension,
				filePath: file.filePath,
				encodeFileName: file.encodeFileName,
				splitPath: null
			};
		}

		// set the world-layer main fields
		function setWorldLayer(file, id, fileData, filePath, thumbnailUrl) {
			const name = (file.name).split('.')[0];

			return {
				_id: id,
				name,
				fileName: file.name,
				displayUrl: filePath,
				filePath,
				fileType: file.fileType,
				format: 'JPEG',
				fileData,
				inputData: file.inputData,
				thumbnailUrl
			};
		}

		// get the metadata of the image file
		function getMetadata(file, filePath, buffer) {
			let imageData;
			const parser = exif.create(buffer);

			// get the image's MetaData from the exif-parser
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

					// format the dates
					const exifDateFormat = 'YYYY:MM:DD hh:mm:ss';
					const {
						modifyDate,
						['date/timeOriginal']: dateTimeOriginal, createDate
					} = metadata;

					imageData = {
						...imageData,
						Make, Model,
						GPSLatitudeRef, GPSLatitude, GPSLongitudeRef, GPSLongitude, GPSAltitude,
						ExifImageWidth, ExifImageHeight,
						modifyDate: moment(modifyDate, exifDateFormat).toString(),
						dateTimeOriginal: moment(dateTimeOriginal, exifDateFormat).toString(),
						createDate: moment(createDate, exifDateFormat).toString()
					};

					// convert the 'fieldOfView' to a number
					if (metadata.fieldOfView) {
						metadata.fieldOfView = parseFloat(metadata.fieldOfView.split(' ')[0]);
					}

					if (metadata.pitch && metadata.yaw && metadata.roll) {
						const {
							relativeAltitude, fieldOfView,
							pitch, yaw, roll,
							cameraPitch, cameraYaw, cameraRoll,
							gimbalRollDegree, gimbalYawDegree, gimbalPitchDegree,
							flightRollDegree, flightYawDegree, flightPitchDegree,
							camReverse, gimbalReverse
						} = metadata;

						imageData = {
							...imageData,
							relativeAltitude, fieldOfView,
							pitch, yaw, roll,
							cameraPitch, cameraYaw, cameraRoll,
							gimbalRollDegree, gimbalYawDegree, gimbalPitchDegree,
							flightRollDegree, flightYawDegree, flightPitchDegree,
							camReverse, gimbalReverse
						};
					}

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
			// set the geoData
			let footPrintPixelSize;
			if (sourceType === 'mobile') {
				footPrintPixelSize = ansyn.mobileFootPrintPixelSize;
			} else {
				footPrintPixelSize = ansyn.droneFootPrintPixelSize;
			}
			let geoData = getGeoDataFromPoint(centerPoint, footPrintPixelSize);
			geoData.isGeoRegistered = false;
			geoData = { ...geoData, centerPoint };
			console.log('setGeoData: ', JSON.stringify(geoData));
			return { ...layer, geoData };
		}

		function setInputData(layer) {
			layer.inputData.sensor.model = layer.imageData.Model ? layer.imageData.Model.trim().toUpperCase() : null;
			layer.inputData.sensor.maker = layer.imageData.maker ? layer.imageData.maker.trim().toUpperCase() : null;
			layer.inputData.tb.flightAltitude = layer.imageData.GPSAltitude ? layer.imageData.GPSAltitude : 0;

			return { ...layer };
		}
	}
}

module.exports = ImageHandler;
