const AdmZip = require('adm-zip');
const uuid = require('uuid');
const { upload } = require('../../../config/config');
const uploadToS3 = require('../s3/uploadToS3');
const UploadFilesToGS = require('./UploadFilesToGS');
const imageHandler = require('./imageHandler');
const fs = require('fs-extra');
const { findFileType } = require('../fs/fileMethods');

const uploadPath = `${__dirname.replace(/\\/g, '/')}/public/uploads/`;

const uploadFiles = (req, res) => {
	console.log('start upload utils to: ', uploadPath);

	// getting the user's input data from the request
	const reqFields = req.fields ? req.fields : {};
	let worldId;
	if (req.params.worldId) {
		worldId = req.params.worldId;
	} else {
		if (req.fields) {
			worldId = reqFields.sharing ? reqFields.sharing.toLowerCase() : upload.defaultWorldId;
		} else {
			worldId = upload.defaultWorldId;
		}
	}
	console.log(`req Fields: ${JSON.stringify(reqFields)}`);
	console.log('worldId: ', worldId);

	// Define the request Files
	// 1. convert it to JSON and back to an Object
	let reqFiles = req.files.uploads;
	const jsonFiles = JSON.stringify(reqFiles);
	reqFiles = JSON.parse(jsonFiles);
	console.log(`req Files: ${jsonFiles}`);
	console.log('req length: ', reqFiles.length);

	// 2. find the file type
	let name;
	let path;
	let file;
	let buffer;

	if (!reqFiles.length) {
		file = reqFiles;
	} else {
		file = reqFiles[0];
	}
	const fileType = findFileType(file.type);

	// 3. check if need to make a ZIP file
	if (!reqFiles.length) {
		// set a single file before upload
		file = setBeforeUpload(file, fileType, uploadPath);
		name = file.name;
		path = file.filePath;
		buffer = fs.readFileSync(path);
		console.log('UploadFiles SINGLE req file(after): ', JSON.stringify(file));

		// upload the file to S3 amazon storage
		uploadFilesToS3(worldId, file, buffer)
			.then(file => {
				// send to the right upload handler according to the type
				uploadHandler(res, worldId, file, fileType, name, path, reqFields, buffer);
			})
			.catch(err => {
				console.error(`Error upload the file to S3: ${err}`);
				res.status(422).send({ errors: [{ title: 'Image Upload Error', detail: err.message }] });
			});
	} else {
		// creating a ZIP file
		console.log('upload multi files...');
		// set the ZIP name according to the first file name
		const splitName = (file.name).split('.');
		name = `${splitName[0]}.zip`;
		path = uploadPath + name;
		console.log('zip path: ', path);

		// creating archives
		let zip = new AdmZip();

		// define the names of the files to be zipped (in Sync operation)
		const zipFiles = reqFiles.map(file => {
			const newFile = setBeforeUpload(file, fileType, uploadPath);

			// add the local file to the zip file
			zip.addLocalFile(newFile.encodePathName);

			return newFile;
		});

		Promise.all(zipFiles)
			.then(zipFiles => {
				console.log(`zip file[0]: ${zipFiles[0].name}`);
				// write the zip to the disk
				console.log('write zip file: ' + path);
				zip.writeZip(path);

				// upload the files to S3 amazon storage
				const files = zipFiles.map(file => {
					console.log(`zipFile file: ${file.name}`);
					buffer = fs.readFileSync(file.filePath);
					return uploadFilesToS3(worldId, file, buffer);
				});

				// send to the right upload handler according to the type
				Promise.all(files)
					.then(files => {
						uploadHandler(res, worldId, files, fileType, name, path, reqFields, buffer);
					});
			})
			.catch(err => {
				console.log(err);
				res.status(422).send({ errors: [{ title: 'Image Upload Error', detail: err.message }] });
			});
	}

};

// ========================================= private  F U N C T I O N S ============================================
// upload the file to S3 amazon storage
const uploadFilesToS3 = (worldId, file, buffer) => {
	return uploadToS3(worldId, file, buffer)
		.then(fileUrl => {
			file.filePath = fileUrl;
			console.log(`succeed to upload file To S3: ${fileUrl}`);
			return file;
		})
		.catch(err => {
			console.error(`Error upload the file to S3: ${err}`);
			throw new Error(err);
		});
};

// send to the right upload handler according to the type
const uploadHandler = (res, worldId, reqFiles, fileType, name, path, reqFields, buffer) => {
	if (fileType === 'image') {
		// save all the file's data in the database
		imageHandler.getImageData(worldId, reqFiles, name, path, reqFields, buffer)
			.then(files => res.send(returnFiles(files, path)));
	} else {
		// upload the file to GeoServer
		const files = UploadFilesToGS.uploadFile(worldId, reqFiles, name, path);
		res.send(returnFiles(files, path));
	}
};

// prepare the file before uploading it
const setBeforeUpload = (file, fileType, uploadPath) => {
	console.log('setBeforeUpload File: ', JSON.stringify(file));
	const name = file.name;
	// replace '/' to '_' in the file name
	if (name.indexOf('/') !== -1) {
		name.replace('/\//g', '_');
	}
	const filePath = uploadPath + name;
	const encodeFileName = encodeURIComponent(name);
	const encodePathName = uploadPath + encodeFileName;

	const newFile = {
		_id: uuid.v4(),
		name,													// file name (include the extension)
		size: file.size,
		// path: file.path,						// the temporary upload directory
		fileUploadDate: new Date(file.mtime).toISOString(),
		fileType,
		filePath,
		encodeFileName,
		encodePathName
	};

	// renaming the file full path (according to the encoded name)
	fs.renameSync(file.path, newFile.encodePathName);

	return newFile;
};

const returnFiles = (files, path) => {
	console.log('upload files: ', JSON.stringify(files));
	// remove the zip file from the temporary uploads directory
	fs.removeSync(path);
	// if ZIP files: remove the zip directory
	const zipPath = path.split('.');
	if (zipPath[1] === 'zip') {
		files.map(file => {
			if (file.fileType === 'vector') {
				file.zipPath = zipPath[0].trim();
			} else {
				file.zipPath = null;
				// remove the zip directory
				fs.removeSync(zipPath[0]);
			}
			// remove files from the temporary uploads directory
			if (file.fileType !== 'image') {
				fs.removeSync(file.encodePathName);
			}
		});
	} else {
		console.log('this file is not a ZIP!');
		files[0].zipPath = null;
		console.log('zipPath: ', files[0].zipPath);
	}
	console.log('return files: ', JSON.stringify(files));
	return files;
};

module.exports = {
	uploadFiles,
	uploadPath
};
