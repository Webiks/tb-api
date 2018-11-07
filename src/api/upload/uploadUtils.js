const AdmZip = require('adm-zip');
const UploadFilesToGS = require('./UploadFilesToGS');
const UploadFilesToFS = require('./UploadFilesToFS');
const fs = require('fs-extra');
require('../fs/fileMethods')();

const uploadPath = `${__dirname.replace(/\\\\/g, '/')}/public/uploads/`;

const uploadFiles = (req, res) => {
	const worldId = req.params.worldId;
	console.log('worldId: ', worldId);
	let reqFiles = req.files.uploads;
	console.log('req Files: ', JSON.stringify(reqFiles));
	console.log('req length: ', reqFiles.length);
	console.log('uploadPath: ', uploadPath);

	// convert the request Files to JSON and back to an Object
	const jsonFiles = JSON.stringify(reqFiles);
	reqFiles = JSON.parse(jsonFiles);

	let name;
	let path;
	let file;
	if (!reqFiles.length) {
		file = reqFiles;
	} else {
		file = reqFiles[0];
	}
	// find the file type
	const fileType = findFileType(file.type);

	// check if need to make a ZIP file
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
		UploadFilesToFS.uploadFile(worldId, reqFiles, name, path)
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
		name,
		size: file.size,
		path: file.path,
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
	const splitPath = path.split('.');
	if (splitPath[1] === 'zip') {
		files.map(file => {
			if (file.fileType === 'vector') {
				file.splitPath = splitPath[0].trim();
			} else {
				file.splitPath = null;
				// remove the zip directory
				fs.removeSync(splitPath[0]);
			}
			// remove files from the temporary uploads directory
			if (file.fileType !== 'image') {
				fs.removeSync(file.encodePathName);
			}
		});
	} else {
		console.log('this file is not a ZIP!');
		files[0].splitPath = null;
		console.log('splitPath: ', files[0].splitPath);
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
};


module.exports = {
	uploadFiles,
	guid,
	uploadPath
};