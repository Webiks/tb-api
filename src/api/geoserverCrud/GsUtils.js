const { bboxPolygon } = require('@turf/turf');
const gsLayers = require('./GsLayers');

class GsUtils {
	// 1. get the layer's info (resource)
	static getLayerInfoFromGeoserver(worldLayer, worldId) {
		return gsLayers.getLayerInfoFromGeoserver(worldId, worldLayer.name)
			.then(layerInfo => {
				return {
					...worldLayer,
					geoserver: {
						layer: layerInfo.layer
					}
				};
			});
	}

	// 2. get the layer's details
	static getLayerDetailsFromGeoserver(worldLayer, resourceUrl) {
		return gsLayers.getLayerDetailsFromGeoserver(resourceUrl)
			.then(layerDetails => {
				// get the layer details data according to the layer's type
				console.log('2. got Layer Details...');
				let data;
				if (worldLayer.fileType === 'raster') {
					data = parseLayerDetails(worldLayer, layerDetails.coverage);
					data.metadata = { dirName: layerDetails.coverage.metadata.entry.$ };
				}
				else if (worldLayer.fileType === 'vector') {
					data = parseLayerDetails(worldLayer, layerDetails.featureType);
					data.metadata = { recalculateBounds: layerDetails.featureType.metadata.entry.$ };
				} else {
					throw new Error('ERROR: unknown layer TYPE!');
				}
				worldLayer.geoserver.data = data;

				// set the store's name
				worldLayer.geoserver.store.name = (worldLayer.geoserver.store.storeId).split(':')[1];

				// set the GeoData fields (bbox , centerPoint and droneCenter, that it's the same point, for rasters and vectors)
				const centerPoint =
					[worldLayer.geoserver.data.latLonBoundingBox.minx, worldLayer.geoserver.data.latLonBoundingBox.maxy];
				const droneCenter = centerPoint;
				const polygon = worldLayer.geoserver.data.latLonBoundingBox;
				console.log('getLayerDetailsFromGeoserver polygon: ', JSON.stringify(polygon));
				const bbox = [polygon.minx, polygon.miny, polygon.maxx, polygon.maxy];
				const footprint = bboxPolygon(bbox);
				console.log('getLayerDetailsFromGeoserver footprint: ', JSON.stringify(footprint));
				worldLayer.geoData = { droneCenter, footprint, centerPoint, bbox, isGeoRegistered: true };

				return worldLayer;
			});
	}

	// 3. get the store's data
	static getStoreDataFromGeoserver(worldLayer, storeUrl) {
		return gsLayers.getStoreDataFromGeoserver(storeUrl)
			.then(store => {
				console.log('3. got Store Data...');
				// get the store data according to the layer's type
				if (worldLayer.fileType === 'raster') {
					console.log('GsUtils get RASTER data...');
					worldLayer.geoserver.store = store.coverageStore;
					// translate map to an object
					worldLayer.geoserver.store = {
						connectionParameters: {
							namespace: store.coverageStore.connectionParameters.entry.$
						}
					};

					worldLayer.fileData.filePath = store.coverageStore.url;                 // the url of the geoserver data_dir/upload

				}
				else if (worldLayer.fileType === 'vector') {
					console.log('GsUtils get VECTOR data...');
					worldLayer.geoserver.store = store.dataStore;
					// translate map to an object
					const url = store.dataStore.connectionParameters.entry.find(entry => entry['@key'] === 'url').$;
					console.log(`vector url: ${url}`);

					const namespace = store.dataStore.connectionParameters.entry.find(entry => entry['@key'] === 'namespace').$;
					console.log(`vector namespace: ${namespace}`);

					worldLayer.geoserver.store = {
						connectionParameters: {
							namespace,
							url
						}
					};

					worldLayer.fileData.filePath = worldLayer.geoserver.store.connectionParameters.url;        // the temp upload url (in tb-api/src/api/upload)
					// comment: after uploading vectors to s3 - need to change this filePath
				}
				else {
					return worldLayer;
				}

				// return the world-layer with all the data from GeoServer
				return worldLayer;
			});
	}

	static getAllLayerData(worldLayer, worldId) {
		const { geoserver } = require('../../../config/config');
		return this.getLayerInfoFromGeoserver(worldLayer, worldId)
			.then(layerInfo => {
				// 2. get the layer's details
				return this.getLayerDetailsFromGeoserver(layerInfo, layerInfo.geoserver.layer.resource.href);
			})
			.then(layerDetails => {
				const baseThumbnailUrl = `${worldLayer.displayUrl}${geoserver.wmsThumbnailParams.start}${layerDetails.geoserver.layer.resource.name}`;
				const bbox = [
					layerDetails.geoserver.data.nativeBoundingBox.minx,
					layerDetails.geoserver.data.nativeBoundingBox.miny,
					layerDetails.geoserver.data.nativeBoundingBox.maxx,
					layerDetails.geoserver.data.nativeBoundingBox.maxy
				];
				layerDetails.thumbnailUrl = `${baseThumbnailUrl}&bbox=${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}&srs=${layerDetails.geoserver.data.srs}${geoserver.wmsThumbnailParams.end}`;

				// 3. get the store's data
				return this.getStoreDataFromGeoserver(layerDetails, layerDetails.geoserver.data.store.href);
			})
			.catch(error => {
				const consoleMessage = `db LAYER: ERROR Get Layer Data From Geoserver!: ${error}`;
				console.log(consoleMessage);
				return null;
			});
	}

	// delete the layer from GeoServer
	static removeLayerFromGeoserver(resourceUrl, storeUrl) {
		// 1. delete the layer according to the resource Url
		// 2. delete the store
		return gsLayers.deleteLayerFromGeoserver(resourceUrl)
			.then(() => gsLayers.deleteLayerFromGeoserver(storeUrl));
	}
}

//================================================Private Functions=====================================================
// parse layer data
const parseLayerDetails = (worldLayer, data) => {
	worldLayer.geoserver = {
		layer: worldLayer.geoserver.layer,
		data,
		store: {
			storeId: data.store.name
		}
	};
	// set the latLonBoundingBox
	worldLayer.geoserver.data.latLonBoundingBox = data.latLonBoundingBox;
	// translate maps to objects
	worldLayer.geoserver.data.nativeCRS =
		data.nativeCRS.$
			? data.nativeCRS.$
			: data.nativeCRS;
	worldLayer.geoserver.data.nativeBoundingBox.crs =
		data.nativeBoundingBox.crs.$
			? data.nativeBoundingBox.crs.$
			: data.nativeBoundingBox.crs;

	return worldLayer.geoserver.data;
};

module.exports = GsUtils;
