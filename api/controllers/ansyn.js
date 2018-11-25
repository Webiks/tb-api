'use strict';
const exif = require('exif-parser');
const fs = require('fs-extra');
const fetch = require('../../src/api/ansyn/fetchLayers');
const layerModel = require('../../src/database/schemas/LayerSchema');

module.exports = {
	uploadImage,
	fetchLayers,
	layerById,
	layerThumbnailById
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
				res.status(404).json({ message: 'Layer not found' })
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

function layerThumbnailById(req, res) {
	// 1. get the layer by ID
	layerModel.findOne({ _id: req.swagger.params.id.value })
		.then(layer => {
			if (!layer) {
				console.log('layerById not found');
				res.status(404).json('Layer not found')
			} else {
				console.log('layerById success');

				// 2. read the image file metadata by exif (relative Path)
				console.log('start get thumbnail from the Metadata of the image...');
				const buffer = fs.readFileSync(layer.filePath);
				const parser = exif.create(buffer);
				const result = parser.parse();

				// 3. get the thumbnail of the image
				if (result.hasThumbnail('image/jpeg')){
					res.json(`data:image/jpeg;base64,${result.getThumbnailBuffer().toString('base64')}`);

				} else {
					res.status(404).json('Thumbnail not found');
				}
			}
		})
		.catch(error => {
			console.log('layerById failed:', error.message);
			res.status(500).json('failed to find layer');
		});
}
