const { mongo } = require('../../config/globals');


const fetchLayers = (req, res) => {
	const { geometry, dates, queries = [] } = req.body;
	const start = Date.parse(dates.start);
	const end = Date.parse(dates.end);
	const parsedQueries = queries.reduce((initQuery, { field, values, isMatch = true }) => ({
		...initQuery,
		[field]: isMatch ? { $in: values } : { $nin: values }
	}), {});

	const query = {
		'overlay.date': { $gt: start, $lt: end },
		'overlay.footprint': { $geoIntersects: { $geometry: geometry } },
		...parsedQueries
	};

	mongo.db.collection(mongo.collections.OVERLAYS).find(query).toArray((err, layers) => {
		if (err) {
			return res.status(500).send({ message: err });
		}
		console.log(`fetchLayers find ${layers.length} items.`)
		res.json(layers);
	});
};

const fetchLayer = (req, res) => {
	mongo.db.collection(mongo.collections.OVERLAYS).findOne({ _id: req.swagger.params.id.value }, (err, layer) => {
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
