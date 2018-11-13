const layerModel = require('../../database/schemas/LayerSchema');
const worldModel = require('../../database/schemas/WorldSchema');

const fetchLayers = (req, res) => {
	console.log("fetchLayers req.body: ", JSON.stringify(req.body));
	findWorld({ name: req.body.worldName })
		.then((world) => {
			if (!world) {
				throw new Error('No World!');
			}
			return world;
		})
		.then((world) => {
			let start = req.body.dates.start,
					end = req.body.dates.end;
			const worldlayers = world.layersId,
						geometry = req.body.geometry;
			console.log(`world layersId: ${JSON.stringify(worldlayers)}`);
			// define the dates
			start = addTimeZoneToDate(start.toString());
			end = addTimeZoneToDate(end.toString());
			console.log(`find layers date numbers: ${JSON.stringify({ start, end })}`);

			findLayers(worldlayers, start, end, geometry)
				.then((layers = []) => {
					console.log(`fetchLayers: find ${layers.length} layers!`);
						return layers;
				});
		})
		.catch((err) => {
			console.log(err);
			return `No World! ${err}`;
		});
};

// ========================================= private  F U N C T I O N S ============================================
const findWorld = ({ name }) => worldModel.findOne({ name });

const addTimeZoneToDate = (date, timeZone) => {
	// check if the date inculde time
	if (date.indexOf(':') !== -1) {
		// check if the time include a time zone or GMT
		if (!(date.indexOf('Z') !== -1) && !(date.indexOf('GMT') !== -1)) {
			// add 'GMT' in the end of the date
			date = `${date} GMT`;
		}
	}
	// return the date as a number
	return Date.parse(date);
};

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
