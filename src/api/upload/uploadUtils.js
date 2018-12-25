const AdmZip = require('adm-zip');
const uuid = require('uuid');
const fs = require('fs-extra');
const { upload } = require('../../../config/config');
const uploadToS3 = require('../s3/uploadToS3');
const UploadFilesToGS = require('./UploadFilesToGS');
const imageHandler = require('./imageHandler');
const { findFileTypeAndSource } = require('../fs/fileMethods');

const uploadPath = `${__dirname.replace(/\\/g, '/')}/public/uploads/`;

const uploadFiles = (req, res) => {
	console.log('start upload utils to: ', uploadPath);

	// Define the request Files
	// 1. convert it to JSON and back to an Object
	let reqFiles = req.files.uploads;
	const jsonFiles = JSON.stringify(reqFiles);
	reqFiles = JSON.parse(jsonFiles);
	console.log(`req Files: ${jsonFiles}`);
	console.log('req length: ', reqFiles.length);

	// 2. find the worldId and the file type and source
	let worldId;
	let sensorType;
	let name;
	let path;
	let file;
	let fields;
	let buffer;
	let vectorId = null;

	if (!reqFiles.length) {
		file = reqFiles;
		fields = req.fields ? req.fields : null;
	} else {
		file = reqFiles[0];
		fields = req.fields[0] ? req.fields[0] : null;
	}

	if (req.params.worldId) {
		worldId = req.params.worldId;
	} else {
		if (fields) {
			worldId = fields.sharing ? fields.sharing.toLowerCase() : upload.defaultWorldId;
			sensorType = fields.sensorType ? fields.sensorType : null;
		} else {
			worldId = upload.defaultWorldId;
		}
	}
	console.log(`req Fields: ${JSON.stringify(fields)}`);
	console.log('worldId: ', worldId);
	const fileTypeAndSource = findFileTypeAndSource(file.type, sensorType);

	// 3. check if need to make a ZIP file
	if (!reqFiles.length) {
		// set a single file before upload
		file = setBeforeUpload(file, fileTypeAndSource, uploadPath, fields);
		name = file.name;
		path = file.filePath;
		buffer = fs.readFileSync(file.encodePathName);
		console.log('UploadFiles SINGLE req file(after): ', JSON.stringify(file));

		// upload the file to S3 amazon storage
		uploadFilesToS3(file, buffer, vectorId)
			.then(file => {
				// send to the right upload handler according to the type
				uploadHandler(res, worldId, file, name, path, buffer);
			})
			.catch(err => {
				console.error(`Error upload the file to S3: ${err}`);
				res.status(422).send({ errors: [{ title: 'Image Upload Error', detail: err.message }] });
			});
	} else {
		// creating a ZIP file
		console.log('upload multi files...');
		// set the ZIP name according to the first file name
		const splitName = (encodeURIComponent(file.name)).split('.');
		name = `${splitName[0]}.zip`;
		path = uploadPath + name;
		console.log('zip path: ', path);

		// creating archives
		let zip = new AdmZip();

		// define the names of the files to be zipped (in Sync operation)
		const zipFiles = reqFiles.map(file => {
			const newFile = setBeforeUpload(file, fileTypeAndSource, uploadPath, fields);
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
					buffer = fs.readFileSync(file.encodePathName);
					// remove the file from the temporary uploads directory
					fs.removeSync(file.encodePathName);
					return uploadFilesToS3(file, buffer, vectorId);
				});

				// send to the right upload handler according to the type
				Promise.all(files)
					.then(files => {
						uploadHandler(res, worldId, files, name, path, buffer);
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
function uploadHandler(res, worldId, reqFiles, name, path, buffer) {
	if (reqFiles.fileType === 'image') {
		// get all the image data and save it in mongo Database
		imageHandler.getImageData(worldId, reqFiles, name, path, buffer)
			.then(files => res.send(returnFiles(files, path)));
	} else {
		// upload the file to GeoServer and save all the data in mongo Database
		const files = UploadFilesToGS.uploadFile(worldId, reqFiles, name, path);
		res.send(returnFiles(files, path));
	}
}

// upload the file to S3 amazon storage and get its url (including the thumbnail's url)
function uploadFilesToS3(file, buffer, vectorId) {
	return uploadToS3(file, buffer, vectorId)
		.then(uploadUrl => {
			console.log(`uploadUrl: ${JSON.stringify(uploadUrl)}`);
			file.filePath = uploadUrl.fileUrl ? uploadUrl.fileUrl : file.filePath;
			file.thumbnailUrl = uploadUrl.thumbnailUrl ? uploadUrl.thumbnailUrl : null;
			console.log(`succeed to upload file To S3: ${JSON.stringify(file.filePath)}`);
			console.log(`succeed to upload thumbnail To S3: ${JSON.stringify(file.thumbnailUrl)}`);
			return { ...file };
		})
		.catch(err => {
			console.error(`Error upload the file to S3: ${err}`);
			throw new Error(err);
		});
}

// prepare the file before uploading it
function setBeforeUpload(file, fileTypeAndSource, uploadPath, fields) {
	console.log('setBeforeUpload File: ', JSON.stringify(file));
	const name = file.name;
	const fileType = fileTypeAndSource.fileType;
	const sourceType = fileTypeAndSource.sourceType;
	let inputData;
	if (fields){
		inputData = {
			name,
			sensor: {
				type: fields.sensorType ? fields.sensorType : null,
				name: fields.sensorName ? fields.sensorName : null
			},
			ansyn: {
				description: fields.description ? fields.description : null,
				creditName: fields.creditName ? fields.creditName : null
			},
			tb: {
				affiliation: 'UNKNOWN',
				GSD: 0,
				flightAltitude: 0,
				cloudCoveragePercentage: 0
			}
		};
	}

	// replace '/' to '_' in the file name
	if (name.indexOf('/') !== -1) {
		name.replace('/\//g', '_');
	}

	const filePath = uploadPath + name;
	const encodeFileName = encodeURIComponent(name);
	const encodePathName = uploadPath + encodeFileName;
	const fileExtension = name.substring(name.lastIndexOf('.'));

	console.log(`setBeforeUpload encodePathName: ${encodePathName}`);

	const newFile = {
		_id: uuid.v4(),
		name,													// file name (include the extension)
		size: file.size,
		fileUploadDate: new Date(file.mtime).toISOString(),
		fileType,
		sourceType,
		fileExtension,
		filePath,
		encodeFileName,
		encodePathName,
		inputData
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
