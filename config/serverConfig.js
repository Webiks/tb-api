const path = require('path');
const { appPort, geoserver, remote, local, images } = require('./config');

const createConfigUrl = () => {

	// set the local/remote urls
	let baseUrl = '';
	if (process.env.NODE_ENV === 'production') {
		baseUrl = remote.ip;
	} else {
		baseUrl = local.ip;
	}
	console.log('Config Base URL: ' + baseUrl);
	const serverBaseUrl = `http${baseUrl}:${appPort}`;

	// set the Images Directory
	const uploadImageDir = path.resolve(__dirname + images.dir);
	const uploadRelativeImageDir = images.relativeDir;

	// set the Geoserver Urls
	const geoserverBaseUrl = `http${baseUrl}:${geoserver.port}`;
	const baseUrlGeoserver = `${geoserverBaseUrl}/${geoserver.path}`;
	const baseRestUrlGeoserver = `${geoserverBaseUrl}/${geoserver.rest}`;
	const baseWorkspacesUrlGeoserver = `${geoserverBaseUrl}/${geoserver.workspaces}`;
	const reqImportCurl = `${geoserverBaseUrl}/${geoserver.imports}`;
	const baseUrlAppGetLayer = `${serverBaseUrl}/${geoserver.getLayerUrl}`;

	return {
			uploadImageDir,
			uploadRelativeImageDir,
			serverBaseUrl,
			baseUrlGeoserver,
			baseRestUrlGeoserver,
			baseWorkspacesUrlGeoserver,
			reqImportCurl,
			baseUrlAppGetLayer
	};
};

module.exports = {
	configUrl: createConfigUrl()
};
