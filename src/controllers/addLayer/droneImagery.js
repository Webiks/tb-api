const rp = require('request-promise');
const request = require('request');
const { geometry } = require('@turf/turf');
const { remote } = require('../../../config/config');
const fs = require('fs');
const uploadToGeoserver = require('../utils/geoserver/uploadToGeoServer');
const exiftoolParsing = require('../utils/exif/exiftoolParsing');


const gdalPromise = (file, tiffName, ext) => new Promise(resolve => {
	const streamName = remote.gdalTemp;
	const stream = fs.createWriteStream(streamName);
	stream.on('close', () => {
		console.log(`stream close write bytes ${stream.bytesWritten}`);
		const reader = fs.createReadStream(streamName);
		resolve(reader);
	});
	request.post({
		url: remote.gdal,
		formData: {
			image: {
				value: file.buffer,
				options: {
					filename: tiffName + ext,
					contentType: file.mimeType
				}
			}
		}
	}).pipe(stream);

});

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
	droneOverlay['photoTime'] = new Date(date).toISOString();
	const invalidResult = Object.values(exifResult).some((value) => isNaN(value));
	if (invalidResult) {
		throw new Error('Exiftool failed to get location information');
	}
	const cesium = await rp({
		method: 'POST',
		uri: remote.droneDomain,
		body: exifResult,
		json: true
	});
	if (!cesium.bboxPolygon) {
		throw new Error('Unable to get footprint');
	}
	droneOverlay['footprint'] = geometry('MultiPolygon', [cesium.bboxPolygon.geometry.coordinates]);
	const gdal = await gdalPromise(file, tiffName, ext);
	if (typeof gdal === 'object' && gdal.error) {
		throw new Error(gdal.error);
	}
	const geoserverResp = await uploadToGeoserver(workspace, gdal, tiffName);
	if (geoserverResp.error) {
		throw new Error('Geoserver Error');
	}
	droneOverlay.tag = geoserverResp.tag;
	droneOverlay.tag.geo = cesium;
	droneOverlay.geoserver = geoserverResp.geoserver;
	droneOverlay.tag.imageData.ExifImageHeight = exifResult.ExifImageHeight;
	droneOverlay.tag.imageData.ExifImageWidth = exifResult.ExifImageWidth;
	return droneOverlay;
};


module.exports = droneImagery;
