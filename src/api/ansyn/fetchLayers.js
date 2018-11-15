const layerModel = require('../../database/schemas/LayerSchema');
const worldModel = require('../../database/schemas/WorldSchema');
const DBManger = require('../../database/DBManager');

const fetchLayers = ({ worldName, dates, geometry }) => {
	if (!DBManger.isConnected()) {
		return Promise.reject({ message: 'No connection for mongodb!' });
	}
	return worldModel.findOne({ name: worldName })
		.then((world = { layersId: [] }) => world)
		.then((world) => {
			const start = Date.parse(dates.start);
			const end = Date.parse(dates.end);
			return findLayers(world.layersId, start, end, geometry)
				.then((layers = []) => layers);
		});
};

// ========================================= private  F U N C T I O N S ============================================
const findLayers = (layersId, start, end, $geometry) => {
	console.log(`start findLayers...`);
	return layerModel.find({
		$or: layersId.map((_id) => ({ _id })),
		'geoData.footprint.geometry': { $geoWithin: { $geometry } }
	})
		.then(layers => {
			console.log(`find ${layers.length} layers by geometry!`);
			const matchLayers = layers.filter(layer => (layer.fileData.lastModified >= start && layer.fileData.lastModified <= end));
			console.log(`find ${matchLayers.length} layers by dates!`);
			return matchLayers;
		});
};

module.exports = fetchLayers;
