const express = require('express');
const dbUtils = require('./DbUtils');
const GsWorlds = require('../geoserverCrud/GsWorlds');

const router = express.Router();

const model = 'worldModel';

// ==============
//  CREATE (add)
// ==============
// create a new world (passing a new world object in the req.body)
router.post('/:worldName', (req, res) => {
	const world = req.body;
	const worldName = req.params.worldName;
	world._id = encodeURIComponent(worldName);
	console.log(`db WORLD SERVER: start to CREATE new World: ${world._id} in Geoserver`);
	// 1. in GeoServer
	GsWorlds.createNewWorldOnGeoserver(world._id)
		.then(() => {
			// 2. in the DataBase
			console.log('db WORLD SERVER: start to CREATE new World in the DataBase...');
			dbUtils.createNewWorld(world)
				.then(response => res.send(response));
		})
		.catch(error => {
			const consoleMessage = `db WORLD: ERROR in CREATE a New World in GeoServer!: ${error}`;
			const sendMessage = `ERROR: Failed to create ${req.params.worldName} world!: ${error}`;
			dbUtils.handleError(res, 500, consoleMessage, sendMessage);
		});
});

// ============
//  GET (find)
// ============
// get all the Worlds from the Database
router.get('/', (req, res) => {
	console.log('db WORLD SERVER: start GET ALL Worlds...');
	dbUtils.getAllEntities(model)
		.then(response => res.send(response))
		.catch(error => {
			const consoleMessage = `db WORLD: ERROR in GET-ALL Worlds!: ${error}`;
			const sendMessage = `ERROR in GET-ALL Worlds!: ${error}`;
			dbUtils.handleError(res, 404, consoleMessage, sendMessage);
		});
});

// get One World from the Database by its Name
router.get('/:worldId', (req, res) => {
	console.log(`db WORLD SERVER: start GET ${req.params.worldId} World by id...`);
	dbUtils.getEntity(req.params.worldId, model)
		.then(response => res.send(response))
		.catch(error => {
			const consoleMessage = `db WORLD: ERROR in GET the World!: ${error}`;
			const sendMessage = `ERROR: world ${req.params.worldId} can't be found!: ${error}`;
			dbUtils.handleError(res, 404, consoleMessage, sendMessage);
		});
});

// =========
//  UPDATE
// =========
// update all the World's fields (passing a new world object in the req.body)
router.put('/:worldName', (req, res) => {
	console.log(`db WORLD SERVER: start to UPDATE world ${req.params.worldName}`);
	dbUtils.updateEntity(req.body,model)
		.then(response => res.send(response))
		.catch(error => {
			const consoleMessage = `db WORLD: ERROR in UPDATE the World!: ${error}`;
			const sendMessage = `ERROR: Failed to update ${req.params.worldName} world!: ${error}`;
			dbUtils.handleError(res, 500, consoleMessage, sendMessage);
		});
});

// update a single field in the World (passing the world's id + layers the new value of the field in the req.body)
router.put('/:worldName/:fieldName', (req, res) => {
	console.log(`db WORLD SERVER: start to UPDATE-FIELD world ${req.params.worldName}`);
	const entityId = { _id: req.body['_id'] };

	dbUtils.updateEntityField(entityId, req.params.fieldName, req.body['newValue'], model)
		.then(response => res.send(response))
		.catch(error => {
			const consoleMessage = `db WORLD: ERROR in UPDATE-FIELD the World!: ${error}`;
			const sendMessage = `ERROR: Failed to update ${req.params.worldName} world!: ${error}`;
			dbUtils.handleError(res, 500, consoleMessage, sendMessage);
		});
});

// =========
//  REMOVE
// =========
// delete a world
router.delete('/delete/:worldId', (req, res) => {
	const worldId = req.params.worldId;
	console.log('dbWorlds: delete world id: ', worldId);
	// 1. delete the world(workspace) from GeoServer:
	GsWorlds.deleteWorldFromGeoserver(worldId)
		.then(() => {
			// 2. get the world's layersId Array
			dbUtils.getEntity(worldId, model)
				.then(({ layersId }) => {
					// 3. delete the world from the DataBase
					dbUtils.removeWorld(worldId, layersId)
						.then(() => res.send(`succeed to delete ${worldId} world!`));
				});
		})
		.catch((error) => {
			const consoleMessage = `db WORLD: ERROR in DELETE World from GeoServer!: ${error}`;
			const sendMessage = `ERROR: Failed to delete ${req.params.worldId} world from GeoServer!: ${error}`;
			dbUtils.handleError(res, 404, consoleMessage, sendMessage);
		});
});

module.exports = router;
