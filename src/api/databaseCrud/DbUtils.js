const gsUtils = require('../geoserverCrud/gsUtils');
const worldModel = require('../../database/schemas/WorldSchema');
const layerModel = require('../../database/schemas/LayerSchema');
const MongoCrud = require('../../database/MongoCrud');
const fs = require('fs-extra');

const dbWorldCrud = new MongoCrud(worldModel);
const dbLayerCrud = new MongoCrud(layerModel);

class DbUtils{

	static getAllEntities(model){
		const dbCrud = getModelObj(model);
		return dbCrud.getAll()
			.then(response => response);
	}

	static getEntity(_id, model){
		const dbCrud = getModelObj(model);
		return dbCrud.get({ _id })
			.then(response => response);
	}

	static createNewWorld(world){
		return dbWorldCrud.add(world)
			.then(response => response);
	}

	static createNewLayer(layer, worldId){
		console.log('createNewLayer: start to CREATE new Layer in the DataBase...', layer.name);
		// create the new layer in the Layers list and get the layer id (from mongoDB)
		return dbLayerCrud.add(layer)
			.then(newLayer => {
				// add the layer's Id to the the layersId List in the world
				console.log('createNewLayer: add the layer Id to the layersId list in the world...', newLayer._id);
				return dbWorldCrud.updateField({ _id: worldId }, { layersId: newLayer._id }, 'updateArray')
					.then(() => newLayer);
			});
	}

	static updateEntity(entity, model){
		const dbCrud = getModelObj(model);
		return dbCrud.update(entity)
			.then(response => response);
	}

	static updateEntityField(entityId, fieldName, fieldValue, model){
		console.log('updateLayerField start...');
		console.log(`params: 
			entityId = ${entityId}, 
			fieldName = ${fieldName}, 
			fieldValue = ${JSON.stringify(fieldValue)}, 
			model = ${model}`);

		let updatedField = {};
		updatedField[fieldName] = fieldValue;
		let operation = 'update';
		if (Array.isArray(updatedField)) {
			operation = 'updateArray';
		}

		const dbCrud = getModelObj(model);
		console.log(`dbCrud: ${JSON.stringify(dbCrud)}`);
		return dbCrud.updateField(entityId, updatedField, operation)
			.then(response => response);
	}

	// remove a world
	static removeWorld(worldId, layersId){
		console.log(`start remove world... ${worldId}, layersId: ${layersId}`);
		return dbWorldCrud.remove({ _id: worldId })
			.then(() => {
				// remove the world's layers if non of them exist in another worlds
				layersId.forEach(layerId => this.findAndRemoveLayer(layerId, worldId));
			})
			.then(() => `succeed to delete ${worldId} world!`);
	}


	// get the layer and remove it
	static findAndRemoveLayer(layerId, worldId){
		console.log(`start find and remove layer: ${layerId}`);
		return dbLayerCrud.get({ _id: layerId })
			.then(layer => {
				if (layer.fileType === 'image') {
					return {
						worldId,
						layerId: layer._id,
						layerName: layer.name,
						type: layer.fileType,
						path: layer.filePath
					};
				} else {
					return {
						worldId,
						layerId: layer._id,
						layerName: layer.name,
						type: layer.fileType,
						resourceUrl: layer.geoserver.layer.resource.href,
						storeUrl: layer.geoserver.data.store.href,
						path: layer.fileData.zipPath
					};
				}
			})
			.then(removedLayer => this.removeLayer(removedLayer, worldId, false));
	}

	// remove the layer only if it doesn't exist in another world (from the DataBase and from Geosewrver)
	static removeLayer(removedLayer, worldId, removeFromGeoserver){
		console.log('removedLayer: ', JSON.stringify(removedLayer));
		// 1. get all the worlds except to the current world
		return dbWorldCrud.getListByQuery({ _id: { $not: { $eq: worldId } } })
			.then(worlds => {
				console.log('removeLayer worlds: ' + JSON.stringify(worlds));
				// 2. check if a giving layer exists in another world
				const isLayerExist = worlds.some(world => world.layersId.some(id => id === removedLayer.layerId));
				console.log('isLayerExist: ', isLayerExist);
				// 3. if doesn't exist - remove the layer
				if (!isLayerExist) {
					console.log('start to remove layer: ', removedLayer.layerId);
					// a. remove the layer from the Layers list in the DataBase
					let path = removedLayer.path;
					if (removedLayer.type === 'image') {
						path = path.substring(0, removedLayer.path.lastIndexOf('/'));
					}
					console.log('dbUtils removeLayer path: ', path);
					return removeLayerFromDB(removedLayer.layerId, path)
						.then(() => {
							// b. if it isn't an image - delete the layer from GeoServer:
							if (removeFromGeoserver) {
								return removeLayerFromGeoServer(removedLayer);
							}
						});
				} else {
					return `this '${removedLayer.layerId} exists in other worlds!`;
				}
			});
	}

	// Handle ERRORS
	static handleError(res, status, consoleMessage, sendMessage){
		console.error('db Layer: ' + consoleMessage);
		res.status(status).send(sendMessage);
	}
}

// ========================================= private  F U N C T I O N S ============================================
function getModelObj(model){
	console.log(`start getModelObj...${model}`);
	const dbModel = ( model === 'layerModel' ) ? layerModel : worldModel;
	return new MongoCrud(dbModel);
}

function removeLayerFromDB(layerId, path){
	// 1. remove from the Layers's list in the DataBase
	return dbLayerCrud.remove({ _id: layerId })
		.then(() => {
			console.log(`removeLayerById: ${layerId}`);
			// 2. remove from the file system
			if (path) {
				return fs.removeSync(path);
			}
		});
}

function removeLayerFromGeoServer(layer){
	console.log('dbUtils remove layer: start to delete layer from the GeoServer!');
	return gsUtils.removeLayerFromGeoserver(layer.resourceUrl, layer.storeUrl);
}

module.exports = DbUtils;
