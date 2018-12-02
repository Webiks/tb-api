const exif = require('exif-parser');
const { s3 } = require('./getS3Object');
const { s3Upload } = require('./s3Utils');

const uploadToS3 = (worldId, file, buffer) => {
	console.log(`start upload file To S3...${file.name}`);

	const fileType = file.fileType;
	const folderType = `${fileType}s`;								// define the 'images','rasters','vectors' folders
	const prefix = `${worldId}/${folderType}`;
	const fileName = file.encodeFileName;
	let fileKey;

	if (worldId !== 'public') {
		fileKey = getFileKey(prefix, fileType, fileName);
		// 1. check if the user's folder exists in the s3 bucket
		if (!isFolderExist(worldId)) {
			// 2. create new folders for new user
			return createUserFolder(worldId)
				.then(() => {
					console.log(`Successfully create new folder: ${prefix}`);
					return upload(fileType, fileKey, buffer);
				})
				.catch(err => {
					console.error(err, err.stack);
					return Promise.reject(err);
				});
		} else {
			console.log(`exist file Key: ${fileKey}`);
			return upload(fileType, fileKey, buffer);
		}
	} else {
		const publicPrefix = `${prefix}/${file._id}`;
		fileKey = getFileKey(publicPrefix, fileType, fileName);
		console.log(`public file Key: ${fileKey}`);
		return upload(fileType, fileKey, buffer);
	}
};

// ================================================== Private F U N C T I O N S ========================================
// upload the file to S3 including the thumbnail (if it's an image file)
const upload = (fileType, fileKey, buffer) => {
	const uploadUrl = {
		fileUrl: '',
		thumbnailUrl: ''
	};
	return s3Upload(fileKey, buffer)
		.then(fileUrl => {
			uploadUrl.fileUrl = fileUrl;
			console.log(`s3Upload fileUrl: ${uploadUrl.fileUrl}`);
			// save the image thumbnail
			if (fileType === 'image'){
				console.log('start s3Upload image...');
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
			} else {
				return uploadUrl;
			}
		})
		.catch(err => {
			console.error(err, err.stack);
			throw new Error(err);
		});
};

const getFileKey = (prefix, fileType, fileName) => {
	let fileKey;
	if (fileType === 'vector') {
		const dirName = fileName.split('.')[0];
		fileKey = `${prefix}/${dirName}/${fileName}`;
	} else {
		fileKey = `${prefix}/${fileName}`;
	}
	return fileKey;
};

const isFolderExist = (userName) => {
	console.log('start isFolderExist...');
	s3.listObjectsV2({ Delimiter: '/' }).promise()
		.then(data => {
			console.log(`isFolderExist data: ${JSON.stringify(data)}`);
			if (data.CommonPrefixes.length !== 0) {
				console.log(`isFolderExist folders list: ${JSON.stringify(data.CommonPrefixes)}`);
				const folder = data.CommonPrefixes.filter(({ Prefix }) => Prefix === `${userName}/`);
				if (folder.length !== 0) {
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		})
		.catch(err => {
			console.log(`isFolderExist error: ${err}`);
			return false;
		});
};

// create a new folder if the userName is a new one + return the prefix folder path
const createUserFolder = (userKey) => {
	console.log(`userKey: ${userKey}`);
	// create a new folder with the name of the the encoded userName + the sub-folders
	return createS3Folder(`${userKey}/images/`)
		.then(() => createS3Folder(`${userKey}/rasters/`))
		.then(() => createS3Folder(`${userKey}/vectors/`))
		.catch(err => {
			console.error(err, err.stack);
			throw new Error(err);
		});
};

const createS3Folder = (keyName) => {
	const createNewFolder = s3.putObject({ Key: keyName }).promise();
	return createNewFolder
		.then(() => console.log(`Successfully to create a new folder: ${keyName}`))
		.catch(err => {
			console.error(err, err.stack);
			throw new Error(`There was an error creating your folder: ${err.message}`);
		});
};

module.exports = uploadToS3;
