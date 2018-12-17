const axios = require('axios');
const { upload, remote, ansyn } = require('../../../config/config');
const { getGeoDataFromPoint } = require('./getGeoData');
const { updateEntityField } = require('../databaseCrud/DbUtils');

// get the real polygon of the drone's image
const getDroneGeoData = (file) => {
	console.log('start getDroneGeoData... ');

	const headers = {
		'Content-Type': upload.headers['Content-Type'],
		accept: upload.headers.accept,
		crossOrigin: null
	};

	const body = {
		displayUrl: file.displayUrl,
		GPSLongitude: file.imageData.GPSLongitude,
		GPSLatitude: file.imageData.GPSLatitude,
		relativeAltitude: file.imageData.relativeAltitude,
		gimbalRollDegree: file.imageData.gimbalRollDegree,
		gimbalYawDegree: file.imageData.gimbalYawDegree,
		gimbalPitchDegree: file.imageData.gimbalPitchDegree,
		fieldOfView: file.imageData.fieldOfView,
		ExifImageWidth: file.imageData.ExifImageWidth,
		ExifImageHeight: file.imageData.ExifImageHeight
	};

	console.log(`getDroneGeoData body: ${JSON.stringify(body)}`);

	return axios.post(remote.droneDomain, body, { headers })
		.then(response => {
			console.log(`getDroneGeoData response: ${JSON.stringify(response.data)}`);
			if (response.data.features) {
				const droneCenter = response.data.features[1];
				let footprint;
				// if all succeed
				if (response.data.features[0] !== {} && response.data.features[1] !== {}) {
					console.log("cesium-referance SUCCEED!!!");
					footprint = response.data.features[0];
				}
				// update the footprint according to the fixed drone-center (if the fixed polygon was failed)
				else if (response.data.features[0] === {} && response.data.features[1] !== {}) {
					console.log("cesium-referance: GOT ONLY POINT!!!");
					const newGeoData = getGeoDataFromPoint(droneCenter.geometry.coordinates, ansyn.footPrintPixelSize);
					footprint = newGeoData.footprint;
				}

				file.geoData.droneCenter = droneCenter;
				file.geoData.footprint = footprint;

				// save the changes in mongoDB
				return updateEntityField(file._id, 'geoData', file.geoData, 'layerModel')
					.then(newLayer => newLayer);
			} else {
				// if failed - return the original file
				console.log("cesium-referance FAILED!!!");
				return file;
			}
		})
		.catch(error => {
			console.error(`ERROR get the footprint from the drone: ${error}`);
			return file;
		});

};

module.exports = getDroneGeoData;
