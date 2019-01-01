const { bboxPolygon } = require('@turf/turf');
const gsLayers = require('./GsLayers');

class GsUtils {
	// 1. get the layer's info (resource)
	static getLayerInfoFromGeoserver(worldLayer, worldId, layerName) {
		return gsLayers.getLayerInfoFromGeoserver(worldId, layerName)
			.then(layerInfo => {
				console.log('1. got Layer Info...' + JSON.stringify(layerInfo));
				worldLayer = {
					...worldLayer,
					geoserver: {
						layer: layerInfo.layer
					}
				};
				worldLayer.fileType = layerInfo.layer.type.toLowerCase();         // set the layer type
				console.log('1. return worldLayer: ', JSON.stringify(worldLayer));
				return worldLayer;
			});
	}

	// 2. get the layer's details
	static getLayerDetailsFromGeoserver(worldLayer, resourceUrl) {
		return gsLayers.getLayerDetailsFromGeoserver(resourceUrl)
			.then(layerDetails => {
				// get the layer details data according to the layer's type
				console.log('2. got Layer Details...');
				console.log('2. worldLayer: ', JSON.stringify(worldLayer));
				let data;
				if (worldLayer.fileType === 'raster') {
					data = parseLayerDetails(worldLayer, layerDetails.coverage);
					console.log('getLayerDetailsFromGeoserver data: ', JSON.stringify(worldLayer.data));
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
				console.log('getLayerDetailsFromGeoserver geoData: ', JSON.stringify(worldLayer.geoData));

				console.log('2. return worldLayer: ', JSON.stringify(worldLayer));

				return worldLayer;
			});
	}

	// 3. get the store's data
	static getStoreDataFromGeoserver(worldLayer, storeUrl) {
		return gsLayers.getStoreDataFromGeoserver(storeUrl)
			.then(store => {
				console.log('3. got Store Data...');
				const storeName = worldLayer.geoserver.store.name;
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
					worldLayer.filePath = store.coverageStore.url;                          // for the file path
					console.log('GsUtils RASTER url = ', worldLayer.filePath);
					worldLayer.format = store.coverageStore.type.toUpperCase();       			// set the format
				}
				else if (worldLayer.fileType === 'vector') {
					console.log('GsUtils get VECTOR data...');
					worldLayer.geoserver.store = store.dataStore;
					// translate map to an object
					worldLayer.geoserver.store = {
						connectionParameters: {
							namespace: store.dataStore.connectionParameters.entry[0].$,
							url: store.dataStore.connectionParameters.entry[1].$
						}
					};
					worldLayer.filePath = worldLayer.geoserver.store.connectionParameters.url;        // for the file path
					console.log('GsUtils VECTOR url = ', worldLayer.filePath);
					worldLayer.format = store.dataStore.type.toUpperCase();           			// set the format
				}
				else {
					return worldLayer;
				}

				// set the file name
				const path = worldLayer.filePath;
				console.log('GsUtils store name: ', storeName);
				const extension = path.substring(path.lastIndexOf('.'));
				worldLayer.fileName = `${storeName}${extension}`;
				console.log('GsUtils fileName: ', worldLayer.fileName);
				// return the world-layer with all the data from GeoServer
				console.log('3. return worldLayer: ', JSON.stringify(worldLayer));
				return worldLayer;
			});
	}

	static getAllLayerData(worldLayer, worldId, layerName){
		const {geoserver} = require('../../../config/config');
		return this.getLayerInfoFromGeoserver(worldLayer,worldId, layerName)
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
				//const sendMessage = `ERROR: can't get Layer's Data From Geoserver!: ${error}`;
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
