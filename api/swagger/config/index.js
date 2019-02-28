const paths = require('./paths');

module.exports = {
	swagger: '2.0',
	info: {
		version: '0.0.1',
		title: 'Ansyn-TB API'
	},
	basePath: '/v2/api',
	consumes: [
		'application/json'
	],
	produces: [
		'application/json'
	],
	paths
};
