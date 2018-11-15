'use strict';
const fetch = require('../../src/api/ansyn/fetchLayers');

module.exports = {
	uploadImage,
	fetchLayers
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
			res.status(500).send({ message: error.message });
		});
}
