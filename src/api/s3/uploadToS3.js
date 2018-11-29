const { s3 } = require('./getS3Object');

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
			return createUserFolder(worldId, prefix)
				.then(data => {
					console.log(`Successfully create new folder: ${prefix}`);
					return upload(fileKey, buffer);
				})
				.catch(err => {
					console.error(err, err.stack);
					return Promise.reject(err);
				});
		} else {
			console.log(`exist file Key: ${fileKey}`);
			return upload(fileKey, buffer);
		}
	} else {
		const publicPrefix = `${prefix}/${file._id}`;
		fileKey = getFileKey(publicPrefix, fileType, fileName);
		console.log(`public file Key: ${fileKey}`);
		return upload(fileKey, buffer);
	}
};

// ================================================== Private F U N C T I O N S ========================================
const upload = (fileKey, buffer) => {

	const params = {
		Key: fileKey,
		Body: buffer,
		ACL: 'public-read'
	};

	// upload the file to s3 and return its location
	return s3.upload(params).promise()
		.then(data => {
			console.log(`Successfully uploaded file to ${data.Location}`);
			return data.Location;
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
	console.log(`start isFolderExist...`);
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
const createUserFolder = (userKey, prefix) => {
	console.log(`userKey: ${userKey}`);
	// create a new folder with the name of the the encoded userName + the sub-folders
	return createS3Folder(`${userKey}/images/`)
		.then(data => createS3Folder(`${userKey}/rasters/`))
		.then(data => createS3Folder(`${userKey}/vectors/`))
		.catch(err => {
			console.error(err, err.stack);
			throw new Error(err);
		});
};

const createS3Folder = (keyName) => {
	const createNewFolder = s3.putObject({ Key: keyName }).promise();
	return createNewFolder
		.then(data => console.log(`Successfully to create a new folder: ${keyName}`))
		.catch(err => {
			console.error(err, err.stack);
			throw new Error(`There was an error creating your folder: ${err.message}`);
		});
};

module.exports = uploadToS3;
