const exif = require('exif-parser');
const exiftool = require('exiftool');
const { s3Upload } = require('./s3Utils');

const uploadToS3 = (file, buffer, vectorId) => {
	console.log(`start upload file To S3...${file.name}`);

	const fileKey = getFileKey(file, vectorId);
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
				// try for mobile info
				// exiftool.metadata(buffer, function (err, results) {
				// 	if (err) {
				// 		console.log(`ERROR exiftool: ${err}`);
				// 		reject(err);
				// 	}
				// 	// convert the results to an object
				// 	let metadata = {};
				// 	Object.entries(results).forEach((entry) => {
				// 		const key = entry[0];
				// 		const value = entry[1];
				// 		metadata[key] = value;
				// 	});
				// 	console.log(`s3Upload exif-tool result: ${JSON.stringify(metadata)}`);
				// });

				const parser = exif.create(buffer);
				const result = parser.parse();
				console.log(`s3Upload hasThumbnail: ${result.hasThumbnail('image/jpeg')}`);

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
				} else {
					console.log(`uploadUrl: ${JSON.stringify(uploadUrl)}`);
					return uploadUrl;
				}
			} else {
				console.log(`return uploadUrl: ${JSON.stringify(uploadUrl)}`);
				return uploadUrl;
			}
		})
		.catch(err => {
			console.error(err, err.stack);
			throw new Error(err);
		});
}

function getFileKey(file, vectorId) {
	const fileType = file.fileType;
	const sourceType = file.sourceType;
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
