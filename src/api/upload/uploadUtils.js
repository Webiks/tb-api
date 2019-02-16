const { createNewLayer } = require('../databaseCrud/DbUtils');

// set the File Data from the ReqFiles
const setFileData = (file) => ({
	name: file.name,
	size: file.size,
	fileUploadDate: file.fileUploadDate,
	fileExtension: file.fileExtension,
	format: file.format,
	filePath: file.filePath,
	encodeFileName: file.encodeFileName,
	splitPath: null
});

// set the world-layer main fields
const setWorldLayer = (file, fileData) => {
	let name;
	if (file.fileType === 'image'){
		name = (file.encodeFileName).split('.')[0];					// get the file encoded name without the extension
	} else {
		name = file.layerName;
	}

	return {
		_id: file._id,
		name,
		fileType: file.fileType,
		fileData,
		inputData: file.inputData
	};
};

// save all the image date in mongo Database and return the new layer is succeed
const saveDataToDB = (savedFile, worldId) => createNewLayer(savedFile, worldId)
	.then(newLayer => {
		console.log('createNewLayer OK!');
		return newLayer;
	})
	.catch(error => {
		console.error('ERROR createNewLayer: ', error);
		return null;
	});

module.exports = {
	saveDataToDB,
	setFileData,
	setWorldLayer
};
