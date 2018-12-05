const AdmZip = require('adm-zip');
const uuid = require('uuid');
const fs = require('fs-extra');
const { upload } = require('../../../config/config');
const uploadToS3 = require('../s3/uploadToS3');
const UploadFilesToGS = require('./UploadFilesToGS');
const imageHandler = require('./imageHandler');
const { findFileType } = require('../fs/fileMethods');
const getDroneGeoData = require('../ansyn/getDroneGeoData');

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
	let vectorId = null;

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
		uploadFilesToS3(file, buffer, vectorId)
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
				// write the zip to the disk
				console.log(`write zip file: ${path}`);
				zip.writeZip(path);

				// get the vector's Id of the SHP file
				if (zipFiles[0].fileType === 'vector') {
					const shpFile = zipFiles.filter(file => file.fileExtension.toLowerCase() === '.shp');
					vectorId = shpFile[0]._id;
				}

				// upload the files to S3 amazon storage
				const files = zipFiles.map(file => {
					console.log(`zipFile file: ${file.name}`);
					buffer = fs.readFileSync(file.filePath);
					// remove the file from the temporary uploads directory
					fs.removeSync(file.encodePathName);
					return uploadFilesToS3(file, buffer, vectorId);
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
// send to the right upload handler according to the type
function uploadHandler(res, worldId, reqFiles, fileType, name, path, reqFields, buffer) {
	if (fileType === 'image') {
		// save all the file's data in the database
		console.log(`uploadUtils uploadHandler file imageData: ${JSON.stringify(reqFiles.imageData)}`);
		imageHandler.getImageData(worldId, reqFiles, name, path, reqFields, buffer)
			.then(files => {
				files = returnFiles(files, path);
				res.send(files);

				files = files.length ? files : [files];

				// get the real footprint of the Drone's images
				const promises = files.map(file => {
					return getDroneGeoData(file)
						.then(newFile => newFile);
				});

				return Promise.all(promises);

			});
	} else {
		// upload the file to GeoServer
		let files = UploadFilesToGS.uploadFile(worldId, reqFiles, name, path);
		files = returnFiles(files, path);
		res.send(files);
		return files;
	}
}

// upload the file to S3 amazon storage and get its url (including the thumbnail's url)
function uploadFilesToS3(file, buffer, vectorId) {
	return uploadToS3(file, buffer, vectorId)
		.then(uploadUrl => {
			console.log(`uploadFilesToS3 uploadUrl: ${JSON.stringify(uploadUrl)}`);
			file.filePath = uploadUrl.fileUrl;
			console.log(`succeed to upload file To S3: ${JSON.stringify(file.filePath)}`);
			file = {
				...file,
				imageData: {
					thumbnailUrl: uploadUrl.thumbnailUrl
				}
			};
			console.log(`succeed to upload thumbnail To S3: ${JSON.stringify(file.imageData.thumbnailUrl)}`);
			return file;
		})
		.catch(err => {
			console.error(`Error upload the file to S3: ${err}`);
			throw new Error(err);
		});
}

// prepare the file before uploading it
function setBeforeUpload(file, fileType, uploadPath) {
	console.log('setBeforeUpload File: ', JSON.stringify(file));
	const name = file.name;
	// replace '/' to '_' in the file name
	if (name.indexOf('/') !== -1) {
		name.replace('/\//g', '_');
	}
	const filePath = uploadPath + name;
	const encodeFileName = encodeURIComponent(name);
	const encodePathName = uploadPath + encodeFileName;
	const fileExtension = name.substring(name.lastIndexOf('.'));

	const newFile = {
		_id: uuid.v4(),
		name,													// file name (include the extension)
		size: file.size,
		fileUploadDate: new Date(file.mtime).toISOString(),
		fileType,
		fileExtension,
		filePath,
		encodeFileName,
		encodePathName
	};

	// renaming the file full path (according to the encoded name)
	fs.renameSync(file.path, newFile.encodePathName);

	return newFile;
}

function returnFiles(files, path) {
	console.log('upload files returnFiles path: ', path);
	// remove the file/zip file from the temporary uploads directory
	fs.removeSync(path);
	// if ZIP files: remove only the zip directory
	const zipPath = path.split('.');
	if (zipPath[1] === 'zip') {
		files.map(file => {
			console.log('upload files returnFile file: ', JSON.stringify(file));
			if (file.fileType === 'vector') {
				file.zipPath = zipPath[0].trim();
			} else {
				file.zipPath = null;
				// remove the zip directory
				fs.removeSync(zipPath[0]);
			}
		});
	} else {
		console.log('this file is not a ZIP!');
		files = files.length ? files : [files];
		files[0].zipPath = null;
		console.log('zipPath: ', files[0].zipPath);
	}
	console.log('return files: ', JSON.stringify(files));
	return files;
}

module.exports = {
	uploadFiles,
	uploadPath
};
