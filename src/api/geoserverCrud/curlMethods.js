const { execSync } = require('child_process');          // for using the cURL command line
const { geoserver } = require('../../../config/config');
const configUrl = require('../../../config/serverConfig');

// // setting the cURL commands line (name and password, headers, request url)
const baseCurl = geoserver.baseCurl;
const curlContentTypeHeader = '-H "Content-type:application/json"';
const curlAcceptHeader = '-H  "accept:application/json"';


//====================
//  create JSON Files
//====================
// create the Workspace Json file for creating a new workspace
function createWorkspaceObject(workspaceName) {
	return {
		workspace: {
			name: workspaceName
		}
	};
}

// create the Workspace Json file for creating a new workspace
function createTargetWorkspaceObject(workspaceName) {
	return {
		workspace: {
			name: `"${workspaceName}"`
		}
	};
}

// create the import Json file for uploading files (Rasters or Vectors)
function createImportObject(workspaceName) {
	return {
		import: {
			targetWorkspace: createTargetWorkspaceObject(workspaceName)
		}
	};
}

// adding the data inside the import Json file for uploading Vectors
function createImportObjectWithData(workspaceName, filePath) {
	console.log('import object with data');
	return {
		import: {
			targetWorkspace: createTargetWorkspaceObject(workspaceName),
			data: {
				type: '"file"',
				format: '"Shapefile"',
				file: `"${filePath}"`
			}
		}
	};
}

// SHP file: update the missing format in the DATA field, when getting state: 'NO_FORMAT'
function dataFormatUpdate() {
	return {
		data: {
			format: '"Shapefile"'
		}
	};
}


// SHP file: update the missing projection in the LAYER field, when getting state: 'NO_CRS'
function layerSrsUpdate() {
	return {
		layer: {
			srs: '"EPSG:4326"'
		}
	};
}

//============
//  WORKSPACE
//============
// CREATE a new workspace in geoserver
function createNewWorkspaceInGeoserver(workspaceJsonFile) {
	console.log('Creating a new Workspace using the cURL...');
	const curl_createWorkspace = `${baseCurl} -XPOST ${curlContentTypeHeader} -d "${workspaceJsonFile}" ${configUrl.baseWorkspacesUrlGeoserver}`;
	console.log('succeed to create a new workspace in geoserver...' + curl_createWorkspace);
	return execSync(curl_createWorkspace);
}

// UPDATE the workspace's name in geoserver
function updateWorkspaceInGeoserver(workspaceName, newName) {
	console.log('Updateing Workspace\'s name using the cURL...');
	const curl_updateWorkspace = `${baseCurl} -XPUT ${configUrl.baseWorkspacesUrlGeoserver}/${workspaceName} ${curlAcceptHeader} ${curlContentTypeHeader} -d "{ \"name\": \"${newName}\" }"`;
	console.log(`succeed to update ${workspaceName} workspace to ${newName} ... ${curl_updateWorkspace}`);
	return execSync(curl_updateWorkspace);
}

// DELETE a workspace from geoserver
function deleteWorkspaceFromGeoserver(workspaceName) {
	console.log(`Deleting ${workspaceName} Workspace using the cURL...`);
	const curl_deleteWorkspace = `${baseCurl} -XDELETE ${configUrl.baseWorkspacesUrlGeoserver}/${workspaceName}?recurse=true ${curlAcceptHeader} ${curlContentTypeHeader}`;
	console.log('succeed to delete workspace ' + curl_deleteWorkspace + ' from geoserver');
	return execSync(curl_deleteWorkspace);
}

//============
//   LAYERS
//============
// upload new layer to geoserver by the importer extension

// 1. POST the import JSON file to Geoserver
function postImportObj(importJson) {
	// the importer will return an import object (in Vectors - also will prepare the tasks automatically)
	console.log('Upload File using the cURL...');
	const curl_createEmptyImport = `${baseCurl} -XPOST ${curlContentTypeHeader} -d "${importJson}" ${configUrl.reqImportCurl}`;
	console.log('step 1 is DONE...' + curl_createEmptyImport);
	const importJSON = execSync(curl_createEmptyImport);
	console.log('importJSON: ' + importJSON);
	const importObj = IsJsonOK(importJSON);
	if (!importObj) {
		console.error('the importJSON is empty!');
		return null;
	} else {
		return importObj.import;
	}
}

function getImportObj(importId) {
	// get the import file
	const curl_getImport = `${baseCurl} -XGET ${configUrl.reqImportCurl}/${importId}`;
	console.log('Get the import object...' + curl_getImport);
	const importJSON = execSync(curl_getImport);
	const importObj = IsJsonOK(importJSON);
	if (!importObj) {
		console.error('something is wrong with the JSON import file!');
		return null;
	} else {
		console.log('get the import object...' + JSON.stringify(importObj));
		return importObj.import;
	}
}

function getDataObj(importId) {
	// get the Data file
	const curl_getTask = `${baseCurl} -XGET ${configUrl.reqImportCurl}/${importId}/data`;
	console.log('Get the task object...' + curl_getTask);
	const taskJSON = execSync(curl_getTask);
	const task = IsJsonOK(taskJSON);
	if (!task) {
		console.error('something is wrong with the JSON Data file!');
		return null;
	} else {
		console.log('get the data file...' + JSON.stringify(task));
		return task.task;
	}
}

function getFileObj(importId, fileName) {
	// get the File data
	const curl_getTask = `${baseCurl} -XGET ${configUrl.reqImportCurl}/${importId}/data/files/${fileName}`;
	console.log('Get the task object...' + curl_getTask);
	const taskJSON = execSync(curl_getTask);
	const task = IsJsonOK(taskJSON);
	if (!task) {
		console.error('something is wrong with the JSON data file!');
		return null;
	} else {
		console.log('get the file data object...' + JSON.stringify(task));
		return task.task;
	}
}

function getTaskObj(importId, taskId) {
	// get the task file
	const curl_getTask = `${baseCurl} -XGET ${configUrl.reqImportCurl}/${importId}/tasks/${taskId}`;
	console.log('Get the task object...', curl_getTask);
	const taskJSON = execSync(curl_getTask);
	const task = IsJsonOK(taskJSON);
	if (!task) {
		console.error('something is wrong with the JSON task file!');
		return null;
	} else {
		console.log('the Task object: ', JSON.stringify(task, null, 4));
		return task.task;
	}
}

function getLayerObj(importId, taskId) {
	// get the layer file
	const curl_getLayer = `${baseCurl} -XGET ${configUrl.reqImportCurl}/${importId}/tasks/${taskId}/layer`;
	console.log('Get the layer object...' + curl_getLayer);
	const layerJSON = execSync(curl_getLayer);
	const layerObj = IsJsonOK(layerJSON);
	if (!layerObj) {
		console.error('something is wrong with the JSON layer file!');
		return null;
	}
	console.log('get layer object...' + JSON.stringify(layerObj));
	return layerObj.layer;
}

function updateImportById(updateImportJson, importId) {
	// update the import Json file by ID
	const curl_updateImport = `${baseCurl} -XPUT ${curlContentTypeHeader} -d "${updateImportJson}" ${configUrl.reqImportCurl}/${importId}`;
	console.log('updateFormat: ' + curl_updateImport);
	return execSync(curl_updateImport);
}

function updateImportField(updateImportJson, importId, fieldName) {
	// update the import Field
	const curl_updateImport = `${baseCurl} -XPUT ${curlContentTypeHeader} -d "${updateImportJson}" ${configUrl.reqImportCurl}/${importId}/${fieldName}`;
	console.log('updateFormat: ' + curl_updateImport);
	return execSync(curl_updateImport);
}

function updateTaskById(updateTaskJson, importId, taskId) {
	// update the task in the import Json file by ID
	const curl_updateTask = `${baseCurl} -XPUT ${curlContentTypeHeader} -d "${updateTaskJson}" ${configUrl.reqImportCurl}/${importId}/tasks/${taskId}`;
	console.log('updateTask: ' + curl_updateTask);
	return execSync(curl_updateTask);
}

function updateTaskField(updateTaskJson, importId, taskId, fieldName) {
	// update the task field in the import Json file
	const curl_updateTask = `${baseCurl} -XPUT ${curlContentTypeHeader} -d "${updateTaskJson}" ${configUrl.reqImportCurl}/${importId}/tasks/${taskId}/${fieldName}`;
	console.log('updateTask: ' + curl_updateTask);
	return execSync(curl_updateTask);
}

function sendToTask(filepath, filename, importId) {
	//POST the GeoTiff file to the tasks list, in order to create an import task for it
	console.log('sendToTask: filepath: ' + filepath);
	const curlFileData = `-F name=${filename} -F filedata=@${filepath}`;
	console.log('sendToTask: curlFileData: ' + curlFileData);

	const curl_postToTaskList = `${baseCurl} ${curlFileData} ${configUrl.reqImportCurl}/${importId}/tasks`;
	console.log('sendToTask: curl_postToTaskList: ' + curl_postToTaskList);
	const taskJson = execSync(curl_postToTaskList);
	console.log('taskJSON: ' + taskJson);
	const tasks = IsJsonOK(taskJson);
	if (!tasks) {
		console.error('something is wrong with the JSON tasks file!');
		return null;
	} else {
		console.log('sent to the Tasks Queue...' + JSON.stringify(tasks));
		if (filepath.split('.')[1] === 'zip') {
			console.log('sendToTask zip file: ' + JSON.stringify(tasks.tasks));
			return tasks.tasks;
		} else {
			console.log('sendToTask single file: ' + JSON.stringify(tasks.task));
			return tasks.task;
		}
	}
}

function executeFileToGeoserver(importId) {
	// execute the import task
	const curl_execute = `${baseCurl} -XPOST ${configUrl.reqImportCurl}/${importId}`;
	const execute = execSync(curl_execute);
	console.log('The execute is DONE...', execute);
	console.log('DONE!');
}

function deleteUncompleteImports() {
	// delete the task from the importer queue
	const curl_deletsTasks = `${baseCurl} -XDELETE ${curlAcceptHeader} ${curlContentTypeHeader} ${configUrl.reqImportCurl}`;
	const deleteTasks = execSync(curl_deletsTasks);
	console.log('Delete task from the Importer...' + deleteTasks);
	console.log('DONE!');
}

function IsJsonOK(jsonStr) {
	try {
		return JSON.parse(jsonStr);
	} catch (e) {
		return null;
	}
}

module.exports = {
	createWorkspaceObject,
	createTargetWorkspaceObject,
	createImportObject,
	createImportObjectWithData,
	dataFormatUpdate,
	layerSrsUpdate,
	createNewWorkspaceInGeoserver,
	updateWorkspaceInGeoserver,
	deleteWorkspaceFromGeoserver,
	postImportObj,
	getImportObj,
	getDataObj,
	getFileObj,
	getTaskObj,
	getLayerObj,
	updateImportById,
	updateImportField,
	updateTaskById,
	updateTaskField,
	sendToTask,
	executeFileToGeoserver,
	deleteUncompleteImports,
	IsJsonOK
};
