const uuid = require('uuid');
const exiftoolParsing = require('../utils/exif/exiftoolParsing');
const s3 = require('../utils/s3/getS3Object');

const droneImagery = (fields) => {
	delete fields.buffer;
	console.log(JSON.stringify(fields.file.fieldname, null, 4));
	const id = uuid();
	const {
		file,
		sensorType,
		sensorName,
		description,
		creditName,
		sharing,
		date

	} = fields;

	const { fieldname } = file;

	const res = {
		id,
		name,
		sensorType,
		sensorName,
		// footprint,
		// cloudCoverage,
		// bestResolution,
		// imageUrl,
		// thumbnailUrl,
		// date,
		// photoTime,
		// azimuth: 0,
		// sourceType,
		// isGeoRegistered,
		// creditName

	};

	return exiftoolParsing(file.buffer)
		.then((exifResult) => {
			const invalidResult = Object.values(exifResult).some((value) => isNaN(value));
			if(invalidResult) {
				throw new Error('Exiftool failed to get location information');
			}

			throw new Error('Not implement');
			const uplaodToS3 = s3.upload({ Key: `layers/${id}/${name}`, Body: file.buffer, ACL: 'public-read' }).promise().then(({ Location }) => Location);

			return Promise.all([uplaodToS3])

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
