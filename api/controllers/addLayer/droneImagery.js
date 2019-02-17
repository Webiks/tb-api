const axios = require('axios');
const uuid = require('uuid');
const gm = require('gm');
const {remote } = require('../../../config/config');
const exiftoolParsing = require('../utils/exif/exiftoolParsing');
const s3UploadFile = require('../utils/s3/S3UploadFile');

const createThumbnail = (buffer) => new Promise((resolve, reject) => {
	console.log('buffer' , buffer);
	return gm(buffer)
		.resize('x256')
		.toBuffer((err, thumbnailBuffer) => {
			if (err) {
				console.error(`getImageTiles ERROR: ${err}`);
				return reject(err);
			}
			const result = Buffer.isBuffer(thumbnailBuffer) ? thumbnailBuffer : new Buffer(thumbnailBuffer, 'binary');
			return resolve(result);
		});
});

const droneImagery = (fields) => {
	delete fields.buffer;
	const id = uuid();
	const {
		file,
		sensorType,
		sensorName,
		description,
		creditName,
		sharing,
	} = fields;

	const { originalname: name } = file;


	return exiftoolParsing(file.buffer)
		.then(async ({ request: exifResult, date }) => {
			const invalidResult = Object.values(exifResult).some((value) => isNaN(value));
			if (invalidResult) {
				throw new Error('Exiftool failed to get location information');
			}
			const uplaodToS3 = s3UploadFile(`${id}/${name}`, file.buffer);
			const cesiumData = axios.post(remote.droneDomain, exifResult, { headers: { 'Content-Type': 'application/json' } }).then( ({ data }) => data);
			const thumbnailPromise = createThumbnail(file.buffer)
				.then((thumbnailBuffer) => s3UploadFile(`${id}/thumbnail_${name}`, thumbnailBuffer));
			const [imageUrl, { bboxPolygon: footprint, centerPoint }, thumbnailUrl] = await Promise.all([uplaodToS3, cesiumData, thumbnailPromise]);
			console.log('footprint: ' , footprint);
			console.log('center ' , centerPoint);
			let isGeoRegistered = true;
			const res = {
				overlay: {
					id,
					name,
					sensorType,
					sensorName,
					footprint,
					isGeoRegistered,
					imageUrl,
					date,
					photoTime: new Date(date).toISOString(),
					creditName,
					thumbnailUrl
				},
				extraDate: {
					centerPoint,
					sharing,
					description
				}
			};

			return res;

		});
	// const s3Promise = s3Promise(file.buffer);

	//  id: tbOverlay._id,
	// 	name: tbOverlay.name,
	// 	footprint: geojsonPolygonToMultiPolygon(tbOverlay.geoData.footprint.geometry),
	// 	sensorType: tbOverlay.inputData.sensor.type,
	// 	sensorName: tbOverlay.inputData.sensor.name,
	// 	cloudCoverage: tbOverlay.inputData.cloudCoveragePercentage / 100,
	// 	bestResolution: 1,
	// 	imageUrl: tbOverlay.displayUrl,
	// 	thumbnailUrl: tbOverlay.thumbnailUrl,
	// 	date: new Date(tbOverlay.createdDate),
	// 	photoTime: new Date(tbOverlay.createdDate).toISOString(),
	// 	azimuth: 0,
	// 	sourceType: this.sourceType,
	// 	isGeoRegistered: tbOverlay.geoData.isGeoRegistered,
	// 	tag: tbOverlay,
	// 	creditName: tbOverlay.inputData.ansyn.creditName
};


module.exports = droneImagery;
