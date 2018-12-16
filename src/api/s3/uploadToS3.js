const exif = require('exif-parser');
const gm = require('gm').subClass({ imageMagick: true });
const { s3Upload } = require('./s3Utils');

const uploadToS3 = (file, buffer, vectorId) => {
	console.log(`start upload file To S3...${file.name}`);

	const s3FileUrls = getFileKey(file, vectorId);
	console.log(`s3FileUrls: ${JSON.stringify(s3FileUrls)}`);
	return upload(s3FileUrls, buffer, file);
};

// ================================================== Private F U N C T I O N S ========================================
// upload the file to S3 including the thumbnail (if it's an image file)
function upload(s3FileUrls, buffer, file) {
	const uploadUrl = {
		fileUrl: '',
		tilesUrl: [],
		thumbnailUrl: ''
	};
	const filePath = file.encodePathName;
	const s3Dir = s3FileUrls.s3Dir;
	const fileKey = s3FileUrls.fileKey;
	const fileExtension = file.fileExtension;
	console.log(`start s3Upload image...${fileKey}`);
	console.log(`file extension: ${fileExtension}`);

	return s3Upload(fileKey, buffer)
		.then(fileUrl => {
			uploadUrl.fileUrl = fileUrl;
			console.log(`s3Upload fileUrl: ${uploadUrl.fileUrl}`);
			// tiles the image
			if (file.fileType === 'image') {
				const initTileSize = 256;
				return getImageSize(filePath)
					.then(imageSize => {
						return getImageTiles(buffer, s3FileUrls, fileExtension, initTileSize, imageSize.width)
							.then(tilesUrl => {
								uploadUrl.tilesUrl = tilesUrl;
								// save the image thumbnail
								const parser = exif.create(buffer);
								const result = parser.parse();
								// upload the thumbnail of the image to s3
								if (result.hasThumbnail('image/jpeg')) {
									const thumbnailBuffer = result.getThumbnailBuffer();
									const thumbnailKey = `${s3Dir}_Thumbnail${fileExtension}`;
									console.log(`upload thumbnail key: ${thumbnailKey}`);
									return s3Upload(thumbnailKey, thumbnailBuffer)
										.then(thumbnailUrl => {
											uploadUrl.thumbnailUrl = thumbnailUrl;
											console.log(`return uploadUrl: ${JSON.stringify(uploadUrl)}`);
											return uploadUrl;
										});
								}
							});
					});
			} else {
				return uploadUrl;
			}
		})
		.catch(err => {
			console.error(err, err.stack);
			throw new Error(err);
		});
}

async function getImageTiles(buffer, s3FileUrls,fileExtension, initTileSize, fileWidth) {
	const tilesUrl = [];
	// const zoomLevel = Math.floor(Math.log2(fileWidth / initTileSize));
	// console.log(`zoom level: ${zoomLevel}`);
	let percent = 100;

	// save the tiles according to the zoom levels (the smallest zoom - the biggest tile size)
	// for (let index = 0; index < zoomLevel; index++) {
	for (let index = 0; index < 4; index++) {
		// const tileSize = initTileSize * Math.pow(2, index);
		// console.log(`getImageTiles tileSize: ${tileSize}`);
		console.log(`getImageTiles percent: ${percent}%`);
		await new Promise((resolve, reject) => {
			gm(buffer)
				// .resize(`x${tileSize}`)
				.resize(`${percent}%`)
				.gravity('Center')
				.crop(initTileSize, initTileSize)
				.toBuffer('JPG', function (err, tileBuffer) {
					if (err) {
						console.log(`getImageTiles ERROR: ${err}`);
						return reject(err);
					}
					console.log('tileBuffer:', tileBuffer);
					const body = (Buffer.isBuffer(tileBuffer) ? tileBuffer : new Buffer(tileBuffer, 'binary'));
					// const key = `${s3FileUrls.s3Dir}_Tiles/${zoomLevel - index}${fileExtension}`;
					const key = `${s3FileUrls.s3Dir}_Tiles/${index}${fileExtension}`;
					return resolve(uploadTileToS3(key, body)
						.then(tileUrl => {
							tilesUrl.push(tileUrl);
							return tilesUrl;
						}));
				});
		});
		percent = percent/2;
	}
	return tilesUrl;
}

function uploadTileToS3(key, body) {
	return s3Upload(key, body)
		.then(tileUrl => {
			console.log('tileUrl:', tileUrl);
			return tileUrl;
		});
}

function getFileKey(file, vectorId) {
	const fileType = file.fileType;
	const typeDir = `${fileType}s`;											// define the 'images','rasters','vectors' folders
	const fileName = file.encodeFileName;
	let s3FileUrls = {
		s3Dir: '',
		fileKey: ''
	};

	// if vector - save under the id of the SHX's file inside a directory with the vector's name
	if (vectorId) {
		const dirName = fileName.split('.')[0];
		s3FileUrls.s3Dir = `${typeDir}/${vectorId}/${dirName}/`;
		s3FileUrls.fileKey = `${s3FileUrls.s3Dir}${fileName}`;
	} else {
		s3FileUrls.s3Dir = `${typeDir}/${file._id}/`;
		s3FileUrls.fileKey = `${s3FileUrls.s3Dir}${fileName}`;
		// if image - save the original image as zoom 0 under the 'Tiles' directory
		if (fileType === 'image') {
			const key = s3FileUrls.fileKey;
			s3FileUrls.s3Dir = key.substring(0, key.lastIndexOf('.'));
			s3FileUrls.fileKey = `${s3FileUrls.s3Dir}_Tiles/0${file.fileExtension}`;
		}
	}
	return s3FileUrls;
}

function getImageSize(path) {
	return new Promise((resolve, reject) => {
		console.log('start getImageSize...');
		gm(path).size(function (err, value) {
			if (err) {
				console.log(`getImageTiles ERROR: ${err}`);
				return reject(err);
			}
			console.log('getImageSize value:', value);
			return resolve(value);
		});
	});
}

module.exports = uploadToS3;
