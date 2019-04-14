const { Mobile } = require('../../../config/swagger/paths/layer/sensorTypes');
const { point,bboxPolygon,circle, bbox, geometry } = require('@turf/turf');
const jimp = require('jimp');
const s3UploadFile = require('../utils/s3/S3UploadFile');
const exiftoolParsing = require('../utils/exif/exiftoolParsing');



const mobileImagery = async (id, file) => {
	const mobileOverlay = {
		sensorType: Mobile,
		isGeoRegistered: false,
		tag: {fileType: file.mimeType}
	};
	const { request: exifResult, date } = await exiftoolParsing(file.buffer);
	if(exifResult.GPSLatitude === null || exifResult.GPSLongitude === null){
		throw new Error('Can\'t find GPS Coordinate');
	}
	mobileOverlay.date = new Date(date).getTime();
	mobileOverlay['photoTime'] = new Date(date).toISOString();
	const lonLat = [exifResult.GPSLongitude, exifResult.GPSLatitude];
	mobileOverlay.tag.imageData = {ExifImageWidth: exifResult.ExifImageWidth, ExifImageHeight: exifResult.ExifImageHeight};
	const tPoint = point(lonLat);
	const radius = 0.01;
	const _bbox = bbox(circle(tPoint, radius));
	const pointPolygon = bboxPolygon(_bbox);
	const MultiPolygon = geometry('MultiPolygon', [pointPolygon.geometry.coordinates ]);
	mobileOverlay.footprint = { ...MultiPolygon };
	mobileOverlay.tag.bbox ={minx: _bbox[0], miny: _bbox[1], maxx: _bbox[2], maxy: _bbox[3]};
	const JimpIns =  await jimp.read(file.buffer).then(image => image.resize(256,256)).then( resize => resize.getBufferAsync(jimp.MIME_JPEG));
	const imageUrl = await s3UploadFile(`${id}/${file.originalname}`, file.buffer);
	const thumbnailUrl = await s3UploadFile(`${id}/thumbnail_${file.originalname}`, JimpIns);
	mobileOverlay.imageUrl = imageUrl;
	mobileOverlay.thumbnailUrl = thumbnailUrl;
	return mobileOverlay;
};


module.exports = mobileImagery;
