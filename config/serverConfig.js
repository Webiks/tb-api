const path = require('path');
const { appPort, geoserver, remote, local } = require('./config');

const createConfigUrl = () => {

	// set the local/remote urls
	let baseUrl = '';
	let uploadImageDir = '';
	let uploadRelativeImageDir = '';

	if (process.env.NODE_ENV === 'production') {
		baseUrl = remote.ip;
		uploadImageDir = path.resolve(__dirname + remote.imageDir);
		uploadRelativeImageDir = remote.imageDirRel;
	} else {
		baseUrl = local.ip;
		uploadImageDir = path.resolve(__dirname + local.imageDir);
		uploadRelativeImageDir = local.imageDirRel;
	}

	const serverBaseUrl = `http${baseUrl}:${appPort}`;
	const geoserverBaseUrl = `http${baseUrl}:${geoserver.port}`;

	console.log('Config Base URL: ' + baseUrl);
	console.log('Config uploadImageDir: ' + uploadImageDir);

	// set the geoserver urls
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
