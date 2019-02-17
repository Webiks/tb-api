const exiftool = require('exiftool');
const exifDateFormat = 'YYYY:MM:DD hh:mm:ss';
const moment = require('moment');

const deg2dec = (str) => {
	if (!str) {
		return NaN;
	}
	const rgx = /(\d)+[.]*(\d)*/g;
	const nums = str.match(rgx).map((value) => +value);
	return nums.reduce((res, value, index) => res + (value / 60 ** index), 0);
};

const exiftoolParsing = (buffer) => new Promise((resolve, reject) => {
	exiftool.metadata(buffer, (err, metadata) => {
		if (err) {
			console.log(err);
			reject(err);
		} else {
			resolve({
				request: {
					GPSLatitude: +deg2dec(metadata.gpsLatitude),
					GPSLongitude: +deg2dec(metadata.gpsLongitude),
					ExifImageWidth: +metadata.imageWidth,
					ExifImageHeight: +metadata.imageHeight,
					relativeAltitude: +metadata.relativeAltitude,
					gimbalRollDegree: +metadata.gimbalRollDegree,
					gimbalYawDegree: +metadata.gimbalYawDegree,
					gimbalPitchDegree: +metadata.gimbalPitchDegree,
					fieldOfView: parseFloat(metadata.fieldOfView)
				},
				date:  moment(metadata.createDate, exifDateFormat)
			});
		}
	});

});

module.exports = exiftoolParsing;
