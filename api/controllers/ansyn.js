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
	fetch(req.body)
		.then(layers => {
			res.json(layers)
		})
		.catch(error => {
			res.status = 500;
			res.json({ message: error });
		});
}
