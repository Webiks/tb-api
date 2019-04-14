const sensorTypes = require('../../config/swagger/paths/layer/sensorTypes');
const droneImagery = require('./addLayer/droneImagery');
const mobileImagery = require('./addLayer/mobile');
const config = require('../../config/config');
const uploadToGeoServer = require('./utils/geoserver/uploadToGeoServer');
const uuid = require('uuid');
const { mongo } = require('../../config/globals');

const { buildThumbnailUrl, fetchBBOX, getConveragePath } = require('./utils/geoserver');

const addLayer = (req, res) => {
	req.connection.setTimeout(10 * 60 * 1000);
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
			promiseResp = droneImagery(_id, fields.file, fields.sharing)
				.then((uploads) => ({ ...overlay, ...uploads }))
				.then((_overlay) => ({
					..._overlay,
					tag: { ..._overlay.tag, nativeBoundingBox: _overlay.tag.bbox }
				}));
			break;
		case sensorTypes.Mobile:
			promiseResp = mobileImagery(_id, file).then( upload => ({...overlay , ...upload}));
			break;
		default:
			promiseResp = uploadToGeoServer(fields.sharing, fields.file.buffer, `${_id}.tiff`).then((uploads) => fetchBBOX({ ...overlay, ...uploads }));
	}

	promiseResp.then(overlay => {
		if (overlay.sensorType !== sensorTypes.Mobile) {
			overlay.imageUrl = `${config.geoserver.url}/${fields.sharing}/wms`;
			overlay.thumbnailUrl = buildThumbnailUrl(overlay);
			overlay.geoserver.coverage = getConveragePath(overlay);
		}
		const layer = { _id, overlay, uploadDate: new Date().getTime() };
		mongo.db.collection(mongo.collections.OVERLAYS).insertOne(layer, (err) => {
			if (err) {
				res.status(500).json({ message: err });
			} else {
				console.log('Finish upload layer', layer);
				res.json(layer);
			}
		});
	})
		.catch(err => res.status(500).send(err.message));
};

module.exports = {
	addLayer
};
