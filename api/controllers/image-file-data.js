const exiftoolParsing = require('./utils/exif/exiftoolParsing');

const imageFileData = (req, res) => {
	const { buffer } = req.files.file;
	exiftoolParsing(buffer)
		.then((result) => res.json(result))
		.catch((err) => res.status(500).json({ error: err.message }));
};

module.exports = { imageFileData };
