const AdmZip = require('adm-zip');
const { upload } = require('../../../config/config');
const UploadFilesToGS = require('./UploadFilesToGS');
const UploadFilesToFS = require('./UploadFilesToFS');
const fs = require('fs-extra');
const { findFileType } = require('../fs/fileMethods');

const uploadPath = `${__dirname.replace(/\\/g, '/')}/public/uploads/`;

const uploadFiles = (req, res) => {
	console.log('start upload utils to: ', uploadPath);

	// getting the user's input data from the request
	const reqFields = req.fields ? req.fields : {} ;
	let worldId;
	if (req.params.worldId){
		worldId = req.params.worldId;
	} else {
		if (req.fields){
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
	if (!reqFiles.length) {
		file = reqFiles;
	} else {
		file = reqFiles[0];
	}
	const fileType = findFileType(file.type);

	// 3. check if need to make a ZIP file
	if (!reqFiles.length) {
		// set a single file before upload
		reqFiles = setBeforeUpload(reqFiles, fileType, uploadPath);
		name = reqFiles.name;
		path = reqFiles.filePath;
		console.log('UploadFiles SINGLE req file(after): ', JSON.stringify(reqFiles));
	} else {
		// creating a ZIP file
		console.log('upload multi files...');
		// set the ZIP name according to the first file name
		const splitName = (reqFiles[0].name).split('.');
		name = `${splitName[0]}.zip`;
		path = uploadPath + name;
		console.log('zip path: ', path);

		// creating archives
		let zip = new AdmZip();

		// define the names of the files to be zipped (in Sync operation)
		reqFiles = reqFiles.map(file => {
			let newFile = setBeforeUpload(file, fileType, uploadPath);
			console.log('newFile: ', JSON.stringify(newFile));

			// add the local file to the zip file
			zip.addLocalFile(newFile.encodePathName);

			return newFile;
		});

		// write everything to disk
		console.log('write zip file: ' + path);
		zip.writeZip(path);
	}
	console.log('UploadFiles SEND req files: ', JSON.stringify(reqFiles));

	// send to the right upload handler according to the type
	if (fileType === 'image') {
		// save the file in the File System
		UploadFilesToFS.uploadFile(worldId, reqFiles, name, path, reqFields)
			.then(files => res.send(returnFiles(files, path)));
	} else {
		// upload the file to GeoServer
		const files = UploadFilesToGS.uploadFile(worldId, reqFiles, name, path);
		res.send(returnFiles(files, path));
	}
};

// ========================================= private  F U N C T I O N S ============================================
// prepare the file before uploading it
const setBeforeUpload = (file, fileType, uploadPath) => {
	console.log('setBeforeUpload File: ', JSON.stringify(file));
	const name = file.name;
	const filePath = uploadPath + name;
	const encodeFileName = encodeURI(name);
	const encodePathName = uploadPath + encodeFileName;

	const newFile = {
		_id: guid(),
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

function guid() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}


module.exports = {
	uploadFiles,
	guid,
	uploadPath
};
