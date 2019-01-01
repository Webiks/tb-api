const {
	createImportObject,
	createImportObjectWithData,
	postImportObj,
	getTaskObj,
	layerSrsUpdate,
	sendToTask,
	updateTaskField,
	executeFileToGeoserver,
} = require('../geoserverCrud/curlMethods');

// upload files to GeoServer
class UploadFilesToGS {

	static uploadFile(workspaceName, reqFiles, name, path) {
		let files = reqFiles.length ? reqFiles : [reqFiles];
		console.log('starting to uploadFile to GeoServer...');
		console.log('uploadFile PATH: ', path);
		const fileType = files[0].fileType.toLowerCase();
		let taskMap = new Map();

		if (files.length !== 0) {
			// 1. create the JSON files with the desire workspace
			let importJSON = {};

			console.log('files Type: ' + fileType);
			if (fileType === 'raster') {
				importJSON = createImportObject(workspaceName);
			} else {
				importJSON = createImportObjectWithData(workspaceName, path);
			}
			console.log('importJSON: ' + JSON.stringify(importJSON));

			// 2. get the Import object by POST the JSON files and check it
			let importObj = postImportObj(JSON.stringify(importJSON));
			console.log('import: ' + JSON.stringify(importObj));

			if (importObj) {
				// 3a. for VECTORS only:
				if (fileType === 'vector') {
					// check the STATE of each task in the Task List
					console.log('check the state of each task... ');
					importObj.tasks.map(task => {
						console.log(`task ${task.id} state = ${task.state}`);
						// get the task object and map it into the taskMap object
						setTaskMap(importObj.id, task.id);

						if (task.state !== 'READY') {
							// check the state's error and fix it
							if (task && task.state === 'NO_CRS') {
								const updateLayerJson = JSON.stringify(layerSrsUpdate());
								console.log('NO_CRS updateTaskJson: ' + updateLayerJson);
								// create the update SRS Json files and update the task
								updateTaskField(updateLayerJson, importObj.id, task.id, 'layer');
							} else {
								console.log('something is wrong with the file!');
								files = [];
							}
						}
					});
					if (files.length !== 0) {
						files = uploadToGeoserver(importObj.id);
					}
				}
				// 3b. for RASTERS only: POST the files to the tasks list, in order to create an import task for it
				else {
					let rasterTasks = sendToTask(path, name, importObj.id);

					if (!rasterTasks) {
						console.log('something is wrong with the file!');
						files = [];
					} else {
						// get the task object and map it into the taskMap object
						rasterTasks = rasterTasks.length ? rasterTasks : [rasterTasks];
						rasterTasks.forEach(task => setTaskMap(importObj.id, task.id));
						files = uploadToGeoserver(importObj.id);
					}
				}
			} else {
				console.log('something is wrong with the JSON file!');
				files = [];
			}

			// get the layer name from the completed task object
			files = files.map(file => getLayerNameFromTask(file, importObj.id));
			console.log('return files: ' + JSON.stringify(files, null, 4));
			return files;
		}

		// ============================================= Private Functions =============================================
		// upload the files to GeoServer
		function uploadToGeoserver(importObjId) {
			// 1. execute the import task
			console.log('start executeFileToGeoserver...');
			executeFileToGeoserver(importObjId);
			return files;
		}

		// get the task object and map it into the taskMap object
		function setTaskMap(importObjId, taskId) {
			const task = getTaskObj(importObjId, taskId);
			console.log(`setTaskMap file name: ${task.data.file}`);
			console.log(`setTaskMap task ID: ${task.id}`);
			taskMap.set(task.data.file, task.id);
			console.log(`${task.data.file} task id = ${taskMap.get(task.data.file)}`);
		}

		// get the layer name from the completed task object
		function getLayerNameFromTask(file, importObjId) {
			const taskId = taskMap.get(file.encodeFileName);
			console.log(`taskId = ${taskId}`);
			const task = getTaskObj(importObjId, taskId);
			console.log(`getLayerNameFromTask task: ${JSON.stringify(task)}`);
			return {
				...file,
				geoserver: {
					layer: {
						name: task.layer.name
					}}
			};
		}
	}
}

module.exports = UploadFilesToGS;

