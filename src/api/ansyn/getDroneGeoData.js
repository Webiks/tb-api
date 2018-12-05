const axios = require('axios');
const { upload, remote } = require('../../../config/config');
const { updateEntityField } = require('../databaseCrud/DbUtils');

// get the real polygon of the drone's image
const getDroneGeoData = (file) => {
	console.log('start getDroneGeoData... ');
	let geoData = file.geoData;

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
			// update the mongo
			if (response.data.features){
				geoData = {
					...geoData,
					footprint: response.data.features[0],
					droneCenter: response.data.features[1],
				};
				return updateEntityField(file._id, 'geoData', geoData , 'layerModel')
					.then(newLayer => newLayer);
			} else {
				return file;
			}
		})
		.catch(error => {
			console.error(`ERROR get the footprint from the drone: ${error}`);
			return file;
		});

};

module.exports = getDroneGeoData;
