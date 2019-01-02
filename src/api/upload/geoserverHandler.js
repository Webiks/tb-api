const fs = require('fs-extra');
const UploadFilesToGS = require('./UploadFilesToGS');
const { saveDataToDB, setFileData, setWorldLayer } = require('./uploadUtils');
const { createNewLayer } = require('../databaseCrud/DbUtils');
const gsUtils = require('../geoserverCrud/GsUtils');
const configUrl = require('../../../config/serverConfig');

// upload files to the File System
class GeoserverHandler {

	static getGeoserverData(worldId, reqFiles, name, path) {
		console.log(`starting get Geoserver Data..., ${name}`);

		if (reqFiles.length !== 0) {
			// upload the files to GeoServer
			let files = UploadFilesToGS.uploadFile(worldId, reqFiles, name, path);

			// get ALL layer data
			if (files) {
				files = files.length ? files : [files];
				const images = files.map(file => {
					// 1. set the file Data from the upload file
					const fileData = setFileData(file);

					const fileStat = fs.statSync(file.filePath);
					fileData.fileCreatedDate = fileStat.birthtime;
					console.log('1. set FileData: ' + JSON.stringify(fileData, null, 4));

					// 2. set the world-layer data
					const worldLayer = setWorldLayer(file, fileData);
					worldLayer.displayUrl = `${configUrl.baseUrlGeoserver}/${worldId}/wms`;
					worldLayer.createdDate = new Date(fileData.fileCreatedDate).getTime();
					console.log('2. worldLayer include Filedata: ', JSON.stringify(worldLayer, null, 4));

					// 3. get the metadata of the image file
					return gsUtils.getAllLayerData(worldLayer, worldId)
						.then(newFile => {
							console.log('3. worldLayer include geoserverData: ', JSON.stringify(worldLayer, null, 4));
							// 4. set the geoData of the image file
							return saveDataToDB(newFile, worldId);
						}).catch(error => {
							console.error('ERROR! ', error);
							return null;
						});
				});

				return Promise.all(images);

			} else {
				console.error('ERROR upload the files to GeoServer!');
				return [];
			}
		} else {
			console.error('there ara no files to upload!');
			return [];
		}
	}
}

module.exports = GeoserverHandler;
