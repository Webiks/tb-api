const turf = require('@turf/turf');
const exif = require('exif-parser');
const exiftool = require('exiftool');
const fs = require('fs-extra');
const { createDirSync } = require('../fs/fileMethods');
const createNewLayer = require('../databaseCrud/createNewLayer');
const configUrl = require('../../../config/serverConfig');
const { paths } = require('../../../config/config');
const moment = require('moment');

// upload files to the File System
class UploadFilesToFS {

	static uploadFile(worldId, reqFiles, name, path, fields) {
		let files = reqFiles.length ? reqFiles : [reqFiles];
		console.log('starting to uploadFile to FS...');
		console.log('uploadFile to FS files: ' + JSON.stringify(files));
		console.log('uploadFile to FS fields: ' + JSON.stringify(fields));
		console.log('uploadFile PATH: ' + path);

		if (files.length !== 0) {
			// 1. move the image file into the directory in the name of its id
			const images = files.map(file => {
				const dirPath = `.${paths.staticPath}${paths.imagesPath}/${file._id}`;
				const filePath = `${dirPath}/${file.name}`;
				console.log(`filePath: ${filePath}`);
				createDirSync(dirPath);
				fs.renameSync(file.filePath, filePath);
				console.log(`the '${file.name}' was rename!`);
				const displayUrl = `${configUrl.uploadImageDir}/${file._id}/${file.name}`;

				// 2. set the file Data from the upload file
				const fileData = setFileData(file);
				console.log('1. set FileData: ' + JSON.stringify(fileData));

				// 3. set the world-layer data
				let worldLayer = setLayerFields(file._id, fileData, displayUrl, filePath);
				console.log('2. worldLayer include Filedata: ' + JSON.stringify(worldLayer));

				// 4. get the metadata of the image file
				// const metadata = getMetadata(worldLayer);
				return getMetadata(worldLayer)
					.then(metadata => {
						console.log(`3. include Metadata: ${JSON.stringify(metadata)}`);

						// 5. set the geoData of the image file
						const geoData = setGeoData({ ...metadata });
						console.log(`4. include Geodata: ${JSON.stringify(geoData)}`);

						// 6. set the inputData of the image file
						const inputData = setInputData({ ...geoData });
						const newFile = { ...inputData };
						console.log(`5. include Inputdata: ${JSON.stringify(newFile)}`);

						// 7. save the file to mongo database and return the new file is succeed
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
					})
			});

			return Promise.all(images);

		} else {
			console.log('there ara no files to upload!');
			return [];
		}
		// ============================================= Private Functions =================================================
		// set the File Data from the ReqFiles
		function setFileData(file) {
			const name = file.name;
			const fileExtension = name.substring(name.lastIndexOf('.'));
			return {
				name,
				size: file.size,
				fileUploadDate: file.fileUploadDate,
				fileExtension,
				fileType: 'image',
				encodeFileName: file.encodeFileName,
				splitPath: null
			};
		}

		// set the world-layer main fields
		function setLayerFields(id, file, displayUrl, filePath) {
			const name = (file.name).split('.')[0];

			return {
				_id: id,
				name,
				fileName: file.name,
				displayUrl,
				filePath: filePath,
				fileType: 'image',
				format: 'JPEG',
				fileData: file
			};
		}

		// get the metadata of the image file
		function getMetadata(file) {
			console.log('start get Metadata...');
			const buffer = fs.readFileSync(file.filePath);
			const parser = exif.create(buffer);

			// 1. get the image's MetaData from the exif-parser
			const result = parser.parse();
			const { Make, Model,
							GPSLatitudeRef, GPSLatitude, GPSLongitudeRef, GPSLongitude, GPSAltitude,
							ExifImageWidth, ExifImageHeight } = result.tags;

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
					console.log("metadata object:", JSON.stringify(metadata));

					// convert the 'fieldOfView' to a number
					metadata.fieldOfView = parseFloat(metadata.fieldOfView.split(" ")[0]);
					console.log(`fieldOfView: ${metadata.fieldOfView}, type: ${typeof metadata.fieldOfView}`);

					const {
						gimbalRollDegree, gimbalYawDegree, gimbalPitchDegree,
						flightRollDegree, flightYawDegree, flightPitchDegree, fieldOfView,
						modifyDate, ['date/timeOriginal']: dateTimeOriginal, createDate	} = metadata;

					// format the dates
					const exifDateFormat = 'YYYY:MM:DD hh:mm:ss';

					const imageData = {
						Make, Model,
						GPSLatitudeRef, GPSLatitude, GPSLongitudeRef, GPSLongitude, GPSAltitude,
						ExifImageWidth, ExifImageHeight,
						gimbalRollDegree, gimbalYawDegree, gimbalPitchDegree,
						flightRollDegree, flightYawDegree, flightPitchDegree,
						fieldOfView,
						modifyDate: moment(modifyDate, exifDateFormat).toString(),
						dateTimeOriginal: moment(dateTimeOriginal, exifDateFormat).toString(),
						createDate: moment(createDate, exifDateFormat).toString()
					};

					// set the Date's fields in the layer's model
					file.fileData.fileCreatedDate = imageData.createDate;
					file.createdDate = Date.parse((file.fileData.fileCreatedDate));

					resolve({ ...file, imageData });
				})
			})
		}

		// set the geoData from the image GPS
		function setGeoData(layer) {
			// set the center point
			const centerPoint = [layer.imageData.GPSLongitude || 0, layer.imageData.GPSLatitude || 0];
			console.log('setGeoData center point: ', JSON.stringify(centerPoint));
			// get the Bbox
			const bbox = getBbboxFromPoint(centerPoint, 200);
			console.log('setGeoData polygon: ', JSON.stringify(bbox));
			// get the footprint
			const footprint = getFootprintFromBbox(bbox);
			console.log('setGeoData footprint: ', JSON.stringify(footprint));
			// set the geoData
			const geoData = { centerPoint, bbox, footprint };
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

		// get the Boundry Box from a giving Center Point using turf
		function getBbboxFromPoint(centerPoint, radius) {
			const distance = radius / 1000; 					// the square size in kilometers
			const point = turf.point(centerPoint);
			const buffered = turf.buffer(point, distance, { units: 'kilometers', steps: 4 });
			return turf.bbox(buffered);
		}

		// get footprint from the Bbox
		function getFootprintFromBbox(bbox) {
			return turf.bboxPolygon(bbox);
		}
	}
}

module.exports = UploadFilesToFS;
