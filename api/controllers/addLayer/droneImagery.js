const rp = require('request-promise');
const uuid = require('uuid');
const {geometry} = require('@turf/turf');
const { remote } = require('../../../config/config');
const uploadToGeoserver = require('./uploadToGeoServer');
const exiftoolParsing = require('../utils/exif/exiftoolParsing');

const droneImagery = (file, workspace) => {
	const droneOverlay = {
		id: uuid(),
		sensorType: 'Awesome Drone Imagery (GeoTIFF)',
		isGeoRegistered: true,
	};
	const { originalname: name } = file;
	const tiffName = droneOverlay.id + name.substring(name.lastIndexOf('.'));
	return exiftoolParsing(file.buffer)
		.then(async ({ request: exifResult, date }) => {
			droneOverlay['date'] = new Date(date);
			droneOverlay['photoTime'] = droneOverlay.date.toISOString();
			const invalidResult = Object.values(exifResult).some((value) => isNaN(value));
			if (invalidResult) {
				throw new Error('Exiftool failed to get location information');
			}
			const cesium = rp({
				method: 'POST',
				uri: remote.droneDomain,
				body: exifResult,
				json: true
			});
			const gdal = rp({
				method: 'POST',
				uri: remote.gdal,
				json: true,
				formData: {
					image: {
						value: file.buffer,
						options: {
							filename: tiffName,
							contentType: file.mimeType
						}
					}
				}
			});
			try {
				const [cesiumRes, gdalRes] = await Promise.all([cesium, gdal]);
				droneOverlay['footprint'] = geometry('MultiPolygon', [cesiumRes.bboxPolygon.geometry.coordinates]);
				droneOverlay['bbox'] = cesiumRes.bboxPolygon.coordinates;
				Object.assign(droneOverlay, await uploadToGeoserver(workspace, gdalRes.data, tiffName))
			} catch (err) {
				console.log('Error', err);
				throw err.message;
			}
			return droneOverlay;
		});
};


module.exports = droneImagery;
