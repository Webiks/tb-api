const sensorTypes = require('../../config/swagger/paths/layer/sensorTypes');
const droneImagery = require('./addLayer/droneImagery');
const config = require('../../config/config');
const uploadToGeoServer = require('./utils/geoserver/uploadToGeoServer');
const uuid = require('uuid');
const { mongo } = require('../../config/globals');

const { buildThumbnailUrl, fetchBBOX } = require('./utils/geoserver');

const addLayer = (req, res) => {
	const _id = uuid();

	const fields = {};
	Object.entries(req.swagger.params).forEach(([key, value]) => {
		fields[key] = value.value;
	});
	const { file } = fields;
	const overlayDate = fields.date && !isNaN(fields.date) ? new Date(+fields.date) : new Date();

	let overlay = {
		id: _id,
		name: file.originalname,
		sensorType: fields.sensorType,
		sensorName: fields.sensorName,
		creditName: fields.creditName,
		date: overlayDate.getTime(),
		photoTime: overlayDate.toISOString(),
		isGeoRegistered: true,

	};

	let promiseResp;

	console.log(`Upload ${fields.sensorType}`);

	switch (fields.sensorType) {
		case sensorTypes.DroneImagery:
			promiseResp = droneImagery(_id, fields.file, fields.sharing);
			break;

		case sensorTypes.DroneMap:
			promiseResp = uploadToGeoServer('public', fields.file.buffer, `${_id}.tiff`).then((uploads) => fetchBBOX({ ...overlay, ...uploads }));
			break;

		case sensorTypes.Mobile:
			promiseResp = Promise.resolve({ type: 'mobile' }); //TODO: implement Mobile upload
			break;

		case sensorTypes.Satellite:
			promiseResp = Promise.resolve({ type: 'satellite' }); //TODO: implement Satellite upload
			break;
	}

	promiseResp.then(uploads => {
		overlay = { ...overlay, ...uploads };
		overlay.imageUrl = `${config.geoserver.url}/${fields.sharing}/wms`;
		overlay.thumbnailUrl = buildThumbnailUrl(overlay);
		const layer = { _id, overlay, uploadDate: new Date().getTime() };
		mongo.db.collection(mongo.collections.OVERLAYS).insertOne(layer, (err) => {
			if (err) {
				res.status(500).json({ message: err });
			} else {
				console.log('Finish upload layer', layer);
				res.json(overlay);
			}
		});
	})
		.catch(err => res.status(500).send(err.message));
};

module.exports = {
	addLayer
};
