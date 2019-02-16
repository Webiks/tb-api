const exiftool = require('exiftool');

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
				GPSLatitude: +deg2dec(metadata.gpsLatitude),
				GPSLongitude: +deg2dec(metadata.gpsLongitude),
				ExifImageWidth: +metadata.imageWidth,
				ExifImageHeight: +metadata.imageHeight,
				relativeAltitude: +metadata.relativeAltitude,
				gimbalRollDegree: +metadata.gimbalRollDegree,
				gimbalYawDegree: +metadata.gimbalYawDegree,
				gimbalPitchDegree: +metadata.gimbalPitchDegree,
				fieldOfView: parseFloat(metadata.fieldOfView)
			});
		}
	});

});

const imageFileData = (req, res) => {
	const { buffer } = req.files.file[0];
	exiftoolParsing(buffer)
		.then((result) => res.json(result))
		.catch((err) => res.status(500).json({ error: err.message }));
};

module.exports = { imageFileData };
