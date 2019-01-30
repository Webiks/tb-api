const fetchAllLayers = require('../utils/fetchAllLayers');
const layerModel = require('../../src/database/schemas/LayerSchema');

const fetchLayers = (req, res) => {
	console.log('fetchLayers...');
	fetchAllLayers(req.body)
		.then(layers => {
			console.log('fetchLayers success:', layers.length);
			res.json(layers);
		})
		.catch(error => {
			console.log('fetchLayers failed:', error.message);
			res.status(500).json({ message: error.message });
		});
};

const fetchLayer = (req, res) => {
	console.log(req.swagger.params.id.value);
	layerModel.findOne({ _id: req.swagger.params.id.value })
		.then(layer => {
			if (!layer) {
				console.log('layerById not found');
				res.status(404).json({ message: 'Layer not found' });
			} else {
				console.log('layerById success');
				res.json(layer);
			}
		})
		.catch(error => {
			console.log('layerById failed:', error.message);
			res.status(500).json({ message: 'failed to find layer' });
		});
};

module.exports = {
	fetchLayers,
	fetchLayer
};
