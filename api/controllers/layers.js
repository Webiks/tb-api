const { mongo } = require('../../config/globals');

const fetchLayers = (req, res) => {
	const { worldName, geometry, dates, queries = [] } = req.body;

	mongo.db.collection(mongo.collections.WORLDS).findOne({ name: worldName }, (err, world) => {
		if (err) {
			return res.status(500).send({ message: err });
		}
		if (!world) {
			return res.json([]);
		}
		const start = Date.parse(dates.start);
		const end = Date.parse(dates.end);
		const parsedQueries = queries.reduce((initQuery, { field, values, isMatch = true }) => ({
			...initQuery,
			[field]: isMatch ? { $in: values } : { $nin: values }
		}), {});

		const query = {
			$or: world.layersId.map((_id) => ({ _id })),
			'overlay.date': { $gt: start, $lt: end },
			'overlay.footprint': { $geoIntersects: { $geometry: geometry } },
			...parsedQueries
		};

		mongo.db.collection(mongo.collections.LAYERS).find(query).toArray((err, layers) => {
			if (err) {
				return res.status(500).send({ message: err });
			}
			res.json(layers);
		});
	});
};

const fetchLayer = (req, res) => {
	mongo.db.collection(mongo.collections.LAYERS).findOne({ _id: req.swagger.params.id.value }, (err, layer) => {
		if (err) {
			return res.status(500).json({ message: 'failed to find layer' });
		}
		if (!layer) {
			return res.status(404).json({ message: 'Layer not found' });
		}
		return res.json(layer);
	});
};

module.exports = {
	fetchLayers,
	fetchLayer
};
