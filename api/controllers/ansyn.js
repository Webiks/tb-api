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
	console.log('fetchLayers controller req: ', req.body);
	fetch(req, res)
		.then(layers => {
			console.log(`fetchLayers controller response: succeed to find ${layers.length} layers`);
			res.json(layers)
		})
		.catch(error => {
			res.json(error.message);
		});
}
