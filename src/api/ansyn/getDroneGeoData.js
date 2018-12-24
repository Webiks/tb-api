const axios = require('axios');
const { center } = require('@turf/turf');
const { upload, remote, ansyn } = require('../../../config/config');
const { getGeoDataFromPoint } = require('./getGeoData');

// get the real polygon of the drone's image
const getDroneGeoData = (file) => {
	console.log('start getDroneGeoData... ');

	const headers = {
		'Content-Type': upload.headers['Content-Type'],
		accept: upload.headers.accept,
		crossOrigin: null
	};

	const body = {
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

	console.log(`${file.name}: getDroneGeoData body: ${JSON.stringify(body)}`);

	return axios.post(remote.droneDomain, body, { headers })
		.then(response => {
			console.log(`${file.name}: getDroneGeoData response: ${JSON.stringify(response.data)}`);
			if (response.data) {
				let footprint = response.data.bboxPolygon;
				let droneCenter = response.data.centerPoint;
				// if got only the drone center point - find a fixed polygon around the given center point
				if (footprint === null && droneCenter !== null) {
					console.log(`${file.name}: cesium-referance: GOT ONLY POINT!!!`);
					const newGeoData = getGeoDataFromPoint(droneCenter.geometry.coordinates, ansyn.footPrintPixelSize);
					footprint = newGeoData.footprint;
				}
				// if got only the polygon - find the center point from the given polygon
				else if (footprint !== null && droneCenter === null) {
					console.log(`${file.name}: cesium-referance: GOT ONLY POLYGON!!!`);
					droneCenter = center(footprint);
				} else {
					// if all succeed
					file.geoData.isGeoRegistered = true;
					console.log(`${file.name}: cesium-referance SUCCEED!!!`);
				}
				file.geoData.droneCenter = droneCenter;
				file.geoData.footprint = footprint;

				return file;

			} else {
				// if failed - return the original file
				console.log(`${file.name}: cesium-referance FAILED!!!`);
				return file;
			}
		})
		.catch(error => {
			console.error(`${file.name}: ERROR get the footprint from the drone: ${error}`);
			return file;
		});

};

module.exports = getDroneGeoData;
