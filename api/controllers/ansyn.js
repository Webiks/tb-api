'use strict';
const { layers } = require('../../src/api/ansyn/fetchLayers');

module.exports = {
	uploadImage,
	fetchLayers
};

function uploadImage(req, res) {
	res.json({ message: 'Not implemented yet' });
}

function fetchLayers(req, res) {
	res.json({ layers: layers });
	// res.json([]);
}
