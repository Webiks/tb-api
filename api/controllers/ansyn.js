'use strict';
// const { layers } = require('../../src/api/ansyn/fetchLayers');
const fetch = require('../../src/api/ansyn/fetchLayers');

module.exports = {
	uploadImage,
	fetchLayers
};

function uploadImage(req, res) {
	res.json({ message: 'Not implemented yet' });
}

function fetchLayers(req, res) {
	console.log('fetchLayers controller req: ', req.body);
	fetch(req, res)
		.then(layers => {
			console.log(`fetchLayers controller response: succedd to find ${layers.length} layers`);
			res.json(layers)
		})
		.catch(error => {
			res.json(error.message);
		});
}
