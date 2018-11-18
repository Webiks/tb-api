const { appPort, geoserver, remote, paths } = require('./config');

const createConfigUrl = () => {
	// set the local/remote urls
	const baseUrl = process.env.NODE_ENV === 'production' ? remote.domain : remote.localDomain;

	const uploadImageDir = `${baseUrl}:${appPort}${paths.staticPath}${paths.imagesPath}`;
	// set the Geoserver Urls
	const geoserverBaseUrl = `${baseUrl}:${geoserver.port}`;
	const baseUrlGeoserver = `${geoserverBaseUrl}/${geoserver.path}`;
	const baseWorkspacesUrlGeoserver = `${geoserverBaseUrl}/${geoserver.workspaces}`;
	const reqImportCurl = `${geoserverBaseUrl}/${geoserver.imports}`;

	return {
			uploadImageDir,
			baseUrlGeoserver,
			baseWorkspacesUrlGeoserver,
			reqImportCurl
	};
};

module.exports = createConfigUrl();
