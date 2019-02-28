const globals = require('../../../../config/globals');

const saveLayerOnDB = (layer, worldId) => {
	console.log('createNewLayer: start to CREATE new Layer in the DataBase...', layer.name);
	return new Promise((resolve, reject) => {
		globals.db.collection('layers').insertOne(layer, (layerErr) => {
			if (layerErr) {
				reject(layerErr);
			} else {
				globals.db.collection('worlds').updateOne({ _id: worldId }, { $push: { layersId: layer._id } }, (worldErr, worldData) => {
					if (worldErr) {
						reject(worldErr);
					} else {
						resolve(worldData);
					}
				});
			}
		});
	});
};

module.exports = saveLayerOnDB;
