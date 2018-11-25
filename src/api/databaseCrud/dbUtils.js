const gsUtils = require('../geoserverCrud/gsUtils');
const worldModel = require('../../database/schemas/WorldSchema');
const layerModel = require('../../database/schemas/LayerSchema');
const MongoCrud = require('../../database/MongoCrud');
const fs = require('fs-extra');

const dbWorldCrud = new MongoCrud(worldModel);
const dbLayerCrud = new MongoCrud(layerModel);

// Handle ERRORS
const handleError = (res, status, consoleMessage, sendMessage) => {
	console.error('db Layer: ' + consoleMessage);
	res.status(status).send(sendMessage);
};

// get the layer and remove it
const findAndRemoveLayer = (layerId, worldId) => {
	console.log(`start find and remove layer: ${layerId}`);
	dbLayerCrud.get({ _id: layerId })
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
		.then(removedLayer => removeLayer(removedLayer, worldId, false));
};

// remove the layer only if it doesn't exist in another world (from the DataBase and from Geosewrver)
const removeLayer = (removedLayer, worldId, removeFromGeoserver) => {
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
};

// ========================================= private  F U N C T I O N S ============================================
const removeLayerFromDB = (layerId, path) => {
	// 1. remove from the Layers's list in the DataBase
	return dbLayerCrud.remove({ _id: layerId })
		.then(() => {
			console.log(`removeLayerById: ${layerId}`);
			// 2. remove from the file system
			if (path) {
				return fs.removeSync(path);
			}
		});
};

const removeLayerFromGeoServer = (layer) => {
	console.log('dbUtils remove layer: start to delete layer from the GeoServer!');
	return gsUtils.removeLayerFromGeoserver(layer.resourceUrl, layer.storeUrl);
};

module.exports = {
	handleError,
	findAndRemoveLayer,
	removeLayer
};
