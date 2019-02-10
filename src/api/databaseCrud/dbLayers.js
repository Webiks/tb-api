const express = require('express');
const router = express.Router();

const dbUtils = require('./DbUtils');
const gsLayers = require('../geoserverCrud/GsLayers');
const { geoserver } = require('../../../config/config');

const model = 'layerModel';

// ==============
//  CREATE (add)
// ==============
// create a new layer in the DataBase(passing a new worldLayer object in the req.body)
router.post('/:worldId/:layerName', (req, res) => {
	console.log('create Layer: req.body = ', JSON.stringify(req.body));
	console.log('create Layer: worldId = ', req.params.worldId);
	dbUtils.createNewLayer(req.body, req.params.worldId)
		.then(newLayer => res.send(newLayer))
		.catch(error => {
			const consoleMessage = `db LAYER: ERROR to CREATE a new Layer!: ${error}`;
			const sendMessage = `ERROR: failed to create new layer!: ${error}`;
			dbUtils.handleError(res, 500, consoleMessage, sendMessage);
		});
});

// ============
//  GET (find)
// ============
// get all the Layers list from the Database
router.get('/', (req, res) => {
	console.log('db LAYER SERVER: start GET ALL Layers...');
	dbUtils.getAllEntities(model)
		.then(response => res.send(response))
		.catch(error => {
			const consoleMessage = `db LAYER: ERROR in GET-ALL Layers!: ${error}`;
			const sendMessage = `ERROR: there are no layers!: ${error}`;
			dbUtils.handleError(res, 404, consoleMessage, sendMessage);
		});
});

// get a Layer from the Database by id
router.get('/:layerId', (req, res) => {
	console.log(`db LAYER SERVER: start GET ${req.params.layerId} Layer by id...`);
	dbUtils.getEntity(req.params.layerId, model)
		.then(response => res.send(response))
		.catch(error => {
			const consoleMessage = `db LAYER: ERROR in GET a LAYER!: ${error}`;
			const sendMessage = `ERROR: layer ${req.params.layerId} can't be found!: ${error}`;
			dbUtils.handleError(res, 404, consoleMessage, sendMessage);
		});
});

// =========
//  UPDATE
// =========
// update all the Layer's fields (passing a new layer object in the req.body)
router.put('/:layerName', (req, res) => {
	console.log('db WORLD SERVER: start to UPDATE layer ', req.params.layerName);
	dbUtils.updateEntity(req.body, model)
		.then(response => res.send(response))
		.catch(error => {
			const consoleMessage = `db LAYER: UPDATE Layer ERROR!: ${error}`;
			const sendMessage = `ERROR: Failed to update ${req.body.name} layer!: ${error}`;
			dbUtils.handleError(res, 500, consoleMessage, sendMessage);
		});
});

// update a single field in the Layer (passing the new value of the field in the req.body)
router.put('/:layerId/:fieldName', (req, res) => {
	console.log('db LAYER SERVER: start to UPDATE-FIELD layer ', req.params.layerId);
	const entityId = { _id: req.params.layerId };

	dbUtils.updateEntityField(entityId, req.params.fieldName, req.body['newValue'], model)
		.then(response => res.send(response))
		.catch(error => {
			const consoleMessage = `db LAYER:  UPDATE-FIELD Layer ERROR!: ${error}`;
			const sendMessage = `ERROR: Failed to update layer id: ${req.params.layerId}!: ${error}`;
			dbUtils.handleError(res, 500, consoleMessage, sendMessage);
		});
});

// ==============
//  REMOVE layer
// ==============
// delete a layer from World's Layers list in the Database and from the geoserver
router.delete('/delete/:worldId/:layerId', (req, res) => {
	console.log(`db LAYER SERVER: start DELETE layer: ${req.params.layerId}`);
	console.log(`db LAYER SERVER: req body: ${JSON.stringify(req.body)}`);
	const worldId = req.params.worldId;
	const removedLayer = req.body;
	// 1. remove the layer's Id from the world's layersId array
	dbUtils.updateEntityField({ _id: worldId }, 'layersId', req.params.layerId, 'worldModel', 'removeFromArray')
		.then(() => {
			// 2. remove the layer if it doesn't exist in another worlds
			let removeFromGeoserver = false;
			if (!(removedLayer.type === 'image')){
				removeFromGeoserver = true;
			}
			return dbUtils.removeLayer(removedLayer, worldId, removeFromGeoserver)
				.then(response => res.send(response));
		})
		.catch(error => {
			const consoleMessage = `db LAYER: ERROR to REMOVE LAYER!: ${error}`;
			const sendMessage = `ERROR: Failed to delete layer id: ${req.params.layerId}!: ${error}`;
			dbUtils.handleError(res, 500, consoleMessage, sendMessage);
		});
});

// ===================
//  GET from GEOSERVER
// ===================
// get all the World's Layers list from GeoServer
router.get('/geoserver/:worldId', (req, res) => {
	console.log(`geo LAYER SERVER: start GET ALL ${req.params.worldId} World's Layers...`);
	gsLayers.getWorldLayerListFromGeoserver(req.params.worldId)
		.then(response => res.send(response.layers.layer))
		.catch(error => {
			const consoleMessage = `db LAYER: GET-ALL from GeoServer ERROR!: ${error}`;
			const sendMessage = `ERROR: there are no layers!: ${error}`;
			dbUtils.handleError(res, 404, consoleMessage, sendMessage);
		});
});

module.exports = router;
