const exif = require('exif-parser');
const gm = require('gm').subClass({ imageMagick: true });
const { s3Upload } = require('./s3Utils');

const uploadToS3 = (file, buffer, vectorId, sourceType) => {
	console.log(`start upload file To S3...${file.name}`);

	const fileKey = getFileKey(file, vectorId, sourceType);
	console.log(`file Key: ${fileKey}`);
	return upload(file.fileType, fileKey, buffer);
};

// ================================================== Private F U N C T I O N S ========================================
// upload the file to S3 including the thumbnail (if it's an image file)
function upload(fileType, fileKey, buffer) {
	const uploadUrl = {
		fileUrl: null,
		thumbnailUrl: null
	};
	return s3Upload(fileKey, buffer)
		.then(fileUrl => {
			uploadUrl.fileUrl = fileUrl;
			console.log(`s3Upload fileUrl: ${uploadUrl.fileUrl}`);
			// save the image thumbnail
			if (fileType === 'image') {
				const parser = exif.create(buffer);
				const result = parser.parse();
				// create and upload the thumbnail of the image to s3
				if (result.hasThumbnail('image/jpeg')) {
					return saveThumbnailToS3(result.getThumbnailBuffer(), fileKey, uploadUrl);
				} else {
					return createThumbnail(buffer)
						.then(thumbnailBuffer => saveThumbnailToS3(thumbnailBuffer, fileKey, uploadUrl));
				}
			} else {
				return uploadUrl;
			}
		})
		.catch(err => {
			console.error(err, err.stack);
			throw new Error(err);
		});
}

function createThumbnail(buffer){
	return new Promise((resolve, reject) => {
		return gm(buffer)
			.resize('x256')
			.toBuffer('JPG', function (err, thumbnailBuffer) {
				if (err) {
					console.log(`getImageTiles ERROR: ${err}`);
					return reject(err);
				}
				const result = Buffer.isBuffer(thumbnailBuffer) ? thumbnailBuffer : new Buffer(thumbnailBuffer, 'binary');
				return resolve(result);
			});
	});
}

function saveThumbnailToS3(thumbnailBuffer, fileKey, uploadUrl){
	const splitKey = fileKey.split('.');
	const thumbnailKey = `${splitKey[0]}_Thumbanil.${splitKey[1]}`;
	console.log(`upload thumbnail key: ${thumbnailKey}`);
	return s3Upload(thumbnailKey, thumbnailBuffer)
		.then(thumbnailUrl => {
			uploadUrl.thumbnailUrl = thumbnailUrl;
			console.log(`return uploadUrl: ${JSON.stringify(uploadUrl)}`);
			return uploadUrl;
		});
}

function getFileKey(file, vectorId, sourceType) {
	const fileType = file.fileType;
	const dirByType = `${fileType}s`;											// define the 'images','rasters','vectors' folders
	const fileName = file.encodeFileName;
	let fileKey;

	// if vector - save under the id of the SHX's file inside a directory with the vector's name
	if (vectorId) {
		const dirName = fileName.split('.')[0];
		fileKey = `${dirByType}/${vectorId}/${dirName}/${fileName}`;
	} else {
		if (sourceType){
			fileKey = `${dirByType}/${sourceType}/${file._id}/${fileName}`;
		} else {
			fileKey = `${dirByType}/${file._id}/${fileName}`;
		}
	}
	return fileKey;
}

module.exports = uploadToS3;
