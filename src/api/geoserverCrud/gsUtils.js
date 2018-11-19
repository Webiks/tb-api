const GsLayers = require('./GsLayers');
const turf = require('@turf/turf');

// 1. get the layer's info (resource)
const getLayerInfoFromGeoserver = (worldLayer, worldId, layerName) => {
	return GsLayers.getLayerInfoFromGeoserver(worldId, layerName)
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
			// return layerInfo.layer.resource.href;
			return worldLayer;
		});
};

// 2. get the layer's details
const getLayerDetailsFromGeoserver = (worldLayer, resourceUrl) => {
	return GsLayers.getLayerDetailsFromGeoserver(resourceUrl)
		.then(layerDetails => {
			// get the layer details data according to the layer's type
			console.log('2. got Layer Details...');
			console.log('2. worldLayer: ', JSON.stringify(worldLayer));
			let data;
			if (worldLayer.fileType === 'raster') {
				data = parseLayerDetails(worldLayer, layerDetails.coverage);
				// worldLayer.geoserver.data = parseLayerDetails(worldLayer, layerDetails.coverage);
				console.log('getLayerDetailsFromGeoserver data: ', JSON.stringify(worldLayer.data));
				data.metadata = { dirName: layerDetails.coverage.metadata.entry.$ };
			}
			else if (worldLayer.fileType === 'vector') {
				data = parseLayerDetails(worldLayer, layerDetails.featureType);
				// worldLayer.geoserver.data = parseLayerDetails(worldLayer, layerDetails.featureType);
				data.metadata = { recalculateBounds: layerDetails.featureType.metadata.entry.$ };
			}
			else {
				res.status(500).send('ERROR: unknown layer TYPE!');
			}
			worldLayer.geoserver.data = data;

			// set the store's name
			worldLayer.geoserver.store.name = (worldLayer.geoserver.store.storeId).split(':')[1];

			// set the GeoData fields (bbox and centerPoint)
			const centerPoint =
				[worldLayer.geoserver.data.latLonBoundingBox.minx, worldLayer.geoserver.data.latLonBoundingBox.maxy];
			const polygon = worldLayer.geoserver.data.latLonBoundingBox;
			console.log('getLayerDetailsFromGeoserver polygon: ', JSON.stringify(polygon));
			const bbox = [polygon.minx, polygon.miny, polygon.maxx, polygon.maxy];
			const footprint = turf.bboxPolygon(bbox);
			console.log('getLayerDetailsFromGeoserver footprint: ', JSON.stringify(footprint));
			worldLayer.geoData = { centerPoint, bbox, footprint };
			console.log('getLayerDetailsFromGeoserver geoData: ', JSON.stringify(worldLayer.geoData));

			console.log('2. return worldLayer: ', JSON.stringify(worldLayer));
			// return worldLayer.geoserver.data.store.href;
			return worldLayer;
		});
};

// 3. get the store's data
const getStoreDataFromGeoserver = (worldLayer, storeUrl) => {
	return GsLayers.getStoreDataFromGeoserver(storeUrl)
		.then(store => {
			console.log('3. got Store Data...');
			const storeName = worldLayer.geoserver.store.name;
			// get the store data according to the layer's type
			let url;
			if (worldLayer.fileType === 'raster') {
				console.log('gsUtils get RASTER data...');
				worldLayer.geoserver.store = store.coverageStore;
				// translate map to an object
				worldLayer.geoserver.store = {
					connectionParameters: {
						namespace: store.coverageStore.connectionParameters.entry.$
					}
				};
				worldLayer.filePath = store.coverageStore.url;                          // for the file path
				console.log('gsUtils RASTER url = ', worldLayer.filePath);
				worldLayer.format = store.coverageStore.type.toUpperCase();       			// set the format
			}
			else if (worldLayer.fileType === 'vector') {
				console.log('gsUtils get VECTOR data...');
				worldLayer.geoserver.store = store.dataStore;
				// translate map to an object
				worldLayer.geoserver.store = {
					connectionParameters: {
						namespace: store.dataStore.connectionParameters.entry[0].$,
						url: store.dataStore.connectionParameters.entry[1].$
					}
				};
				worldLayer.filePath = worldLayer.geoserver.store.connectionParameters.url;        // for the file path
				console.log('gsUtils VECTOR url = ', worldLayer.filePath);
				worldLayer.format = store.dataStore.type.toUpperCase();           			// set the format
			}
			else {
				return worldLayer;
			}

			// set the file name
			const path = worldLayer.filePath;
			console.log('gsUtils store name: ', storeName);
			const extension = path.substring(path.lastIndexOf('.'));
			worldLayer.fileName = `${storeName}${extension}`;
			console.log('gsUtils fileName: ', worldLayer.fileName);
			// return the world-layer with all the data from GeoServer
			console.log('3. return worldLayer: ', JSON.stringify(worldLayer));
			return worldLayer;
		});
};

//================================================Private Functions=====================================================
// delete the layer from GeoServer
const removeLayerFromGeoserver = (resourceUrl, storeUrl) => {
	// 1. delete the layer according to the resource Url
	// 2. delete the store
	return GsLayers.deleteLayerFromGeoserver(resourceUrl)
		.then(() => GsLayers.deleteLayerFromGeoserver(storeUrl));
};

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
	// set the store's ID
	// worldLayer.geoserver.store.storeId = data.store.name;

	return worldLayer.geoserver.data;
};

module.exports = {
	getLayerInfoFromGeoserver,
	getLayerDetailsFromGeoserver,
	getStoreDataFromGeoserver,
	removeLayerFromGeoserver
};
