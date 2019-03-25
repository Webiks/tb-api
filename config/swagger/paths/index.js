const layers = require('./layers');
const layer = require('./layer');
const layersId = require('./layers/id');
const imageFileData = require('./image-data/image-file-data');
const geoserver = require('./geoserver/geoserver');
const login = require('./login');

module.exports = {
	'/layers': layers,
	'/layers/{id}': layersId,
	'/layer': layer,
	'/image-data': imageFileData,
	'/geoserver/wmts/getCapabilities/{workspace}/{layer}': geoserver,
	...login
};
