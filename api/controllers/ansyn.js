'use strict';
const fetch = require('../../src/api/ansyn/fetchLayers');
const layerModel = require('../../src/database/schemas/LayerSchema');

module.exports = {
	uploadImage,
	fetchLayers,
	layerById,
	layersBySensorName,
	layersBySensorType
};

function uploadImage(req, res) {
	console.log('uploadImage controller req BODY: ', req.body);
	console.log('uploadImage controller req FILES uploads: ', req.files.uploads);
	res.json({ message: 'Not implemented yet' });
}

function fetchLayers(req, res) {
	console.log('fetchLayers...');
	fetch(req.body)
		.then(layers => {
			console.log('fetchLayers success:', layers.length);
			res.json(layers);
		})
		.catch(error => {
			console.log('fetchLayers failed:', error.message);
			res.status(500).json({ message: error.message });
		});
}

function layerById(req, res) {
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
}

function layersBySensorName(req, res) {
	console.log(req.swagger.params.sensorName.value);
	layerModel.find({ 'inputData.sensor.name': req.swagger.params.sensorName.value })
		.then(layers => {
			if (!layers) {
				console.log('layerBySensorName not found');
				res.status(404).json({ message: 'Layers not found' });
			} else {
				console.log('layerBySensorName success');
				res.json(layers);
			}
		})
		.catch(error => {
			console.log('layerBySensorName failed:', error.message);
			res.status(500).json({ message: 'failed to find layers' });
		});
}

function layersBySensorType(req, res) {
	console.log(req.swagger.params.sensorType.value);
	layerModel.find({ 'inputData.sensor.type': req.swagger.params.sensorType.value })
		.then(layers => {
			if (!layers) {
				console.log('layerBySensorType not found');
				res.status(404).json({ message: 'Layers not found' });
			} else {
				console.log('layerBySensorType success');
				res.json(layers);
			}
		})
		.catch(error => {
			console.log('layerBySensorType failed:', error.message);
			res.status(500).json({ message: 'failed to find layers' });
		});
}
