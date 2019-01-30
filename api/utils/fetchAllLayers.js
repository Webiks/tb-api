const layerModel = require('../../src/database/schemas/LayerSchema');
const worldModel = require('../../src/database/schemas/WorldSchema');
const DBManger = require('../../src/database/DBManager');

const fetchAllLayers = ({ worldName, geometry, dates, queries = [] }) => {
	if (!DBManger.isConnected()) {
		return Promise.reject(new Error('No connection for mongodb!'));
	}
	return worldModel.findOne({ name: worldName })
		.then(world => world || { layersId: [] })
		.then(world => {
			const start = Date.parse(dates.start);
			const end = Date.parse(dates.end);
			// set the additional queries
			const parsedQueries = queries.reduce((initQuery, { field, values, isMatch = true }) => ({
				...initQuery,
				[field]: isMatch ? { $in: values } : { $nin: values }
			}), {});
			console.log(`fetchLayers queries: ${JSON.stringify(parsedQueries)}`);

			return _findLayers(world.layersId, geometry, start, end, parsedQueries)
				.then((layers = []) => layers);
		});
};

const _findLayers = (layersId, $geometry, $gt, $lt, parsedQueries) => {
	if (!layersId.length) {
		return Promise.resolve([]);
	}
	return layerModel.find({
		$or: layersId.map((_id) => ({ _id })),
		'createdDate': { $gt, $lt },
		'geoData.footprint.geometry': { $geoIntersects: { $geometry } },
		...parsedQueries
	});
};

module.exports = fetchAllLayers;
