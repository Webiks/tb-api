const rp = require('request-promise');
const { geometry } = require('@turf/turf');
const { remote } = require('../../../config/config');
const uploadToGeoserver = require('../utils/geoserver/uploadToGeoServer');
const exiftoolParsing = require('../utils/exif/exiftoolParsing');

const droneImagery = async (_id, file, workspace) => {
	const droneOverlay = {
		_id,
		sensorType: 'Awesome Drone Imagery (GeoTIFF)',
		isGeoRegistered: true,
	};
	const { originalname: name } = file;
	const tiffName = droneOverlay._id;
	const ext = name.substring(name.lastIndexOf('.'));
	let { request: exifResult, date } = await exiftoolParsing(file.buffer);
	droneOverlay.date = new Date(date).getTime();
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
					filename: tiffName + ext,
					contentType: file.mimeType
				}
			}
		}
	});
	try {
		const [cesiumRes, gdalRes] = await Promise.all([cesium, gdal]);
		droneOverlay['footprint'] = geometry('MultiPolygon', [cesiumRes.bboxPolygon.geometry.coordinates]);
		const geoserverResp = await uploadToGeoserver(workspace, gdalRes.data, tiffName);
		droneOverlay.tag =  geoserverResp.tag;
		droneOverlay.geoserver = geoserverResp.geoserver;
	} catch (err) {
		console.log('Error', err);
		throw err.message;
	}
	droneOverlay.tag.imageData.ExifImageHeight = exifResult.ExifImageHeight;
	droneOverlay.tag.imageData.ExifImageWidth = exifResult.ExifImageWidth;
	return droneOverlay;
};


module.exports = droneImagery;
