const layerModel = require('../../database/schemas/LayerSchema');
const worldModel = require('../../database/schemas/WorldSchema');
const DBManger = require('../../database/DBManager');

const fetchLayers = ({ worldName, geometry, dates, queries = [] }) => {
	if (!DBManger.isConnected()) {
		return Promise.reject(new Error('No connection for mongodb!'));
	}
	return worldModel.findOne({ name: worldName })
		.then(world => world || { layersId: [] })
		.then(world => {
			const start = Date.parse(dates.start);
			const end = Date.parse(dates.end);
			// set the additional queries
			if (queries.length !== 0){
				queries = queries.map(query => {
					const field = query.field;
					console.log(`fetchLayers field: ${field}`);
					const	values = query.values;
					let operator;
					if (query.isMatch){
						operator = { $in: values }
					} else {
						operator = { $nin: values }
					}
					const newQuery = {};
					newQuery[field] = operator ;
					return newQuery;
				});
				console.log(`fetchLayers queries: ${JSON.stringify(queries)}`);
			}
			return _findLayers(world.layersId, geometry, start, end, queries)
				.then((layers = []) => layers);
		});
};

const _findLayers = (layersId, $geometry, $gt, $lt, queries) => {
	if (!layersId.length) {
		return Promise.resolve([]);
	}
	return layerModel.find({
		$or: layersId.map((_id) => ({ _id })),
		'createdDate': { $gt, $lt },
		'geoData.footprint.geometry': { $geoIntersects: { $geometry } }})
		.then(layers => {
			console.log(`fetchLayers:  1.find ${layers.length} layers`);
			if (queries.length !== 0){
				return layerModel.find({
					$or: layers.map((_id) => ({ _id })), $and: queries });
			} else {
				return layers;
			}
		})
};

module.exports = fetchLayers;
