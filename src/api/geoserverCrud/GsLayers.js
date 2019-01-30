const axios = require('axios');
const { upload, geoserver, remote } = require('../../../config/config');
const baseWorkspacesUrlGeoserver = `${remote.baseUrl}:${geoserver.port}/${geoserver.workspaces}`;

const authorization = upload.headers.authorization;

class GsLayers {
	// ==============
	//  GET Requests
	// ==============
	// get a list of all the layer of the world from geoserver by REST api
	static getWorldLayerListFromGeoserver(worldName) {
		const urlGetLayers = `${baseWorkspacesUrlGeoserver}/${worldName}/layers.json`;
		console.log(`GsLayers: start GET-ALL world's layers from Geoserver...${urlGetLayers}`);
		return axios.get(urlGetLayers, { headers: { authorization } })
			.then(response => response.data)
			.catch(error => {
				return handleError(error,`GET-ALL world's layers from Geoserver ERROR!: ${error}`);
			});
	}

	// get the layer type & resource info ("layer" field - type ILayerDetails) from geoserver by REST api
	static getLayerInfoFromGeoserver(worldName, layerName) {
		const urlGetLayer = `${baseWorkspacesUrlGeoserver}/${worldName}/layers/${layerName}.json`;
		console.log('GsLayers: start GET LAYER INFO url = ', urlGetLayer);
		return axios.get(urlGetLayer, { headers: { authorization } })
			.then(response => response.data)
			.catch(error => {
				return handleError(error,`Get Layer Info From Geoserver ERROR! layer ${layerName} can't be found!: ${error}`);
			});
	}

	// get layer's details ("data" field - type ILayerDetails) from geoserver by REST api
	// using the resource href that we got from the "layer's info" request
	static getLayerDetailsFromGeoserver(resourceUrl) {
		console.log('GsLayers: GET LAYER DETAILS url: ', resourceUrl);
		return axios.get(resourceUrl, { headers: { authorization } })
			.then(response => response.data)
			.catch(error => {
				return handleError(error,`Get Layer Details From Geoserver ERROR!: ${error}`);
			});
	}

	// get the layer's store data ("store" field - type ILayerDetails) from geoserver by REST api
	// using the store href that we got from the "layer's details" request
	static getStoreDataFromGeoserver(storeUrl) {
		console.log('GsLayers: start GET STORE DATA url = ', storeUrl);
		return axios.get(storeUrl, { headers: { authorization } })
			.then(response => response.data)
			.catch(error => {
				return handleError(error,`Get Store Data From Geoserver ERROR!: ${error}`);
			});
	}

	// get Capabilities XML file - WMTS Request for display the selected layer
	static getCapabilitiesFromGeoserver(capabilitiesUrl) {
		console.log('GsLayers: start GET CAPABILITIES url = ', capabilitiesUrl);
		return axios.get(capabilitiesUrl, { headers: { authorization } })
			.then(response => response.data)
			.catch(error => {
				return handleError(error,`Get Capabilities From Geoserver ERROR!: ${error}`);
			});
	}

	// =================
	//  DELETE Requests
	// =================
	// delete a layer from geoserver by REST api
	static deleteLayerFromGeoserver(url) {
		console.log('GsWorlds: start DELETE LAYER from GEOSERVER = ', url);
		return axios.delete(`${url}?recurse=true`, { headers: { authorization } })
			.then(response => {
				console.log(`success to delete the layer! ${url}`);
				return response.data;
			})
			.catch(error => {
				return handleError(error, `DELETE layer From Geoserver ERROR!, url: ${url}, error: ${error}`);
			});
	}
}

// ========================================= private  F U N C T I O N S ============================================
function handleError(error, message){
	console.error('gs LAYER: ' + message);
	return error;
}

module.exports = GsLayers;
