const turf = require('@turf/turf');
const exif = require('exif-parser');
const xmpReader = require('xmp-reader');
const fs = require('fs-extra');
const { createDirSync } = require('../fs/fileMethods');
const createNewLayer = require('../databaseCrud/createNewLayer');
const configUrl = require('../../../config/serverConfig');
const { paths } = require('../../../config/config');

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
				const metadata = getMetadata(worldLayer);
				console.log(`3. include Metadata: ${JSON.stringify(metadata)}`);

				// 5. get the XMP metadata of the image file
				return getXmpData({ ...metadata })
					.then(xmpdata => {
						// 6. set the geoData of the image file
						const geoData = setGeoData({ ...xmpdata });
						console.log(`4. include Geodata: ${JSON.stringify(geoData)}`);

						// 7. set the inputData of the image file
						const inputData = setInputData({ ...geoData });
						const newFile = { ...inputData };
						console.log(`5. include Inputdata: ${JSON.stringify(newFile)}`);

						// 8. save the file to mongo database and return the new file is succeed
						return createNewLayer(newFile, worldId)
							.then(newLayer => {
								console.log('createNewLayer result: ' + newLayer);
								return newLayer;
							})
							.catch(error => {
								console.error('ERROR createNewLayer: ' + error);
								return null;
							});
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
			// get the image's MetaData as numbers
			const tags = exifParser(parser, true);

			let imageData = {
				Make: tags.Make,
				Model: tags.Model,
				GPSLatitudeRef: tags.GPSLatitudeRef,
				GPSLatitude: tags.GPSLatitude,
				GPSLongitudeRef: tags.GPSLongitudeRef,
				GPSLongitude: tags.GPSLongitude,
				GPSAltitude: tags.GPSAltitude,
				ExifImageWidth: tags.ExifImageWidth,
				ExifImageHeight: tags.ExifImageHeight
			};

			// get the Dates as strings
			const simpleTags = exifParser(parser, false);

			imageData = {
				...imageData,
				CreateDate: dateFormat(simpleTags.CreateDate),
				ModifyDate: dateFormat(simpleTags.ModifyDate),
				DateTimeOriginal: dateFormat(simpleTags.DateTimeOriginal)
			};

			file.fileData.fileCreatedDate = imageData.CreateDate ? imageData.CreateDate : imageData.ModifyDate;
			console.log("type of fileCreatedDate: ", typeof file.fileData.fileCreatedDate);
			file.createdDate = Date.parse((file.fileData.fileCreatedDate));
			return { ...file, imageData };
		}

		// read the image's MetaData by EXIF
		function exifParser(parser,enableSimpleValues) {
			console.log('start exifParser...', enableSimpleValues);
			parser.enableSimpleValues(enableSimpleValues);
			const result = parser.parse();
			return result.tags;
		}

		function dateFormat(dateString){
			const date = dateString.split(" ");
			const newDate = date[0].replace(/:/g, "-");
			return `${newDate}T${date[1]}`;
		}

		// get the XMP metadata of the image file
		function getXmpData(file) {
			return xmpReader.fromFile(file.filePath)
				.then(data => {
					console.log("XMP DATA: " ,data);
					file.imageData.xmp = data;
					return { ...file };
				})
				.catch(err => {
					console.log(err);
					file.imageData.xmp = {};
					return { ...file };
				});
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
