const exif = require('exif-parser');
// const gm = require('gm');
const im = require('imagemagick');
// const gm = require('gm').subClass({imageMagick: true});
const { s3Upload } = require('./s3Utils');
const { createDirSync } = require('../fs/fileMethods');

const uploadToS3 = (file, buffer, vectorId) => {
	console.log(`start upload file To S3...${file.name}`);

	const fileKey = getFileKey(file, vectorId);
	console.log(`file Key: ${fileKey}`);
	return upload(fileKey, buffer, file);
};

// ================================================== Private F U N C T I O N S ========================================
// upload the file to S3 including the thumbnail (if it's an image file)
function upload(fileKey, buffer, file) {
	const uploadUrl = {
		fileUrl: '',
		thumbnailUrl: ''
	};
	console.log('start s3Upload image...');

	return s3Upload(fileKey, buffer)
		.then(fileUrl => {
			uploadUrl.fileUrl = fileUrl;
			console.log(`s3Upload fileUrl: ${uploadUrl.fileUrl}`);
			// tiles the image
			if (file.fileType === 'image') {
				// gm(buffer, fileName)
				// 	.resize(256,256)
				// 	.toBuffer('JPG', function (err, tileBuffer) {
				// 		if (err) return handle(err);
				// 		console.log('done!');
				// 	})

				const initTileSize = 256;
				const zoomLevel = 5;
				return getImageTiles(file.encodePathName, file.fileExtension, initTileSize, zoomLevel)
					.then(() => {
						// save the image thumbnail
						const parser = exif.create(buffer);
						const result = parser.parse();
						// upload the thumbnail of the image to s3
						if (result.hasThumbnail('image/jpeg')) {
							const splitKey = fileKey.split('.');
							const thumbnailBuffer = result.getThumbnailBuffer();
							const thumbnailKey = `${splitKey[0]}_Thumbanil.${splitKey[1]}`;
							console.log(`upload thumbnail key: ${thumbnailKey}`);
							return s3Upload(thumbnailKey, thumbnailBuffer)
								.then(thumbnailUrl => {
									uploadUrl.thumbnailUrl = thumbnailUrl;
									console.log(`return uploadUrl: ${JSON.stringify(uploadUrl)}`);
									return uploadUrl;
								});
						}
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

async function getImageTiles (filePath, fileExtension, initTileSize, zoomLevel){
	const targetDir = filePath.split('.')[0];
	createDirSync(targetDir);

	for (let index = 0; index < zoomLevel; index++) {
		const tileSize = initTileSize * Math.pow(2,index);
		console.log(`getImageTiles tileSize: ${tileSize}`);
		const tile = await new Promise((resolve, reject) => {
			im.convert([filePath, '-resize', `x${tileSize}`, `${targetDir}/${index}${fileExtension}`],
				function (err, stdout) {
					if (err) {
						console.log(`getImageTiles ERROR: ${err}`);
						return reject(err);
					}
					console.log('stdout:', stdout);
					return resolve(stdout);
				})
		});
	}
	return 'done';
}

function getFileKey(file, vectorId) {
	const fileType = file.fileType;
	const typeDir = `${fileType}s`;											// define the 'images','rasters','vectors' folders
	const fileName = file.encodeFileName;
	let fileKey;

	// if vector - save under the id of the SHX's file inside a directory with the vector's name
	if (vectorId) {
		const dirName = fileName.split('.')[0];
		fileKey = `${typeDir}/${vectorId}/${dirName}/${fileName}`;
	} else {
		fileKey = `${typeDir}/${file._id}/${fileName}`;
	}
	return fileKey;
}

module.exports = uploadToS3;
