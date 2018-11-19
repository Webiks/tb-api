const layerModel = require('../../database/schemas/LayerSchema');
const worldModel = require('../../database/schemas/WorldSchema');
const DBManger = require('../../database/DBManager');

const fetchLayers = ({ worldName, dates, geometry }) => {
	if (!DBManger.isConnected()) {
		return Promise.reject(new Error('No connection for mongodb!'));
	}
	return worldModel.findOne({ name: worldName })
		.then(world => world || { layersId: [] })
		.then(world => {
			const start = Date.parse(dates.start);
			const end = Date.parse(dates.end);
			return _findLayers(world.layersId, start, end, geometry)
				.then((layers = []) => layers);
		});
};

const _findLayers = (layersId, $gt, $lt, $geometry) => {
	if (!layersId.length) {
		return Promise.resolve([]);
	}
	return layerModel.find({
		$or: layersId.map((_id) => ({ _id })),
		'lastModified': { $gt, $lt },
		'geoData.footprint.geometry': { $geoIntersects: { $geometry } }
	})
};

module.exports = fetchLayers;
