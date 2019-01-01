const UploadFilesToGS = require('./UploadFilesToGS');
const {bboxPolygon} = require('@turf/turf');
const {createNewLayer} = require('../databaseCrud/DbUtils');
const gsUtils = require('../geoserverCrud/GsUtils');
const configUrl = require('../../../config/serverConfig');

// upload files to the File System
class GeoserverHandler {

	static getGeoserverData(worldId, reqFiles, name, path) {
		let files = reqFiles.length ? reqFiles : [reqFiles];
		console.log('starting to uploadFile to FS...');

		if (files.length !== 0) {
			// 1. move the image file into the directory in the name of its id
			const images = files.map(file => {
				// 1. set the file Data from the upload file
				const fileData = setFileData(file);
				console.log('1. set FileData: ' + JSON.stringify(fileData, null, 4));

				// 2. set the world-layer data
				let worldLayer = setWorldLayer(file, file._id, fileData,worldId);
				console.log('2. worldLayer include Filedata: ', JSON.stringify(worldLayer, null, 4));
				// 3. get the metadata of the image file
				return getGeoserver(worldLayer, worldId, reqFiles, name, path).then(
					(newFile) => {
						// 4. set the geoData of the image file
						return saveDataToDB(newFile);
					}).catch(error => {
					console.log('ERROR! ', error);
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
		function setWorldLayer(file, id, fileData, worldId) {

			return {
				_id: id,
				displayUrl: `${configUrl.baseUrlGeoserver}/${worldId}/wms`,
				fileData,
				inputData: file.inputData,
			};
		}

		// get the metadata of the image file
		function getGeoserver(worldLayer, worldId, reqFiles, name, path) {
			const {geoserver: {layer: {name: layerName}}} = UploadFilesToGS.uploadFile(worldId, reqFiles, name, path)[0];
			worldLayer.name = layerName;
			worldLayer.createdDate = new Date().getTime();
			return gsUtils.getAllLayerData(worldLayer, worldId, layerName);
		}
	}
}

module.exports = GeoserverHandler;
