const axios = require('axios');
const { geoserver } = require('../../config/config');

const getCapabilities = (req, res) => {
	const { workspace: { value: workspace }, layer: { value: layer } } = req.swagger.params;
	const params = { SERVICE: 'WMTS', REQUEST: 'getCapabilities', VERSION: '1.1.1' };
	axios.get(`${geoserver.url}/${workspace}/${layer}/gwc/service/wmts`, { params })
		.then((capabilities) => res.send(capabilities.data))
		.catch((err) => res.status(500).send({ error: err.message }));
};

module.exports = { getCapabilities };
