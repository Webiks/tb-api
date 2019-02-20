const sensorTypes = require('../swagger/config/paths/layer/sensorTypes');
const droneImagery = require('./addLayer/droneImagery');
const config = require('../../config/config');
const createNewLayer = require('../../src/api/databaseCrud/createNewLayer');

const addLayer = (req, res) => {
	const fields = {};
	Object.entries(req.swagger.params).forEach(([key, value]) => {
		fields[key] = value.value;
	});
	console.log('fields: ', fields);
	const { file } = fields;
	let overlay = {
		name: file.originalname,
		sensorType: fields.sensorType,
		sensorName: fields.sensorName,
		creditName: fields.creditName,
	};
	console.log('overlay' , overlay);
	if(fields.date && !isNaN(fields.date)){
		overlay['date'] = new Date(+fields.date);
	}else{
		overlay['date'] = new Date();
	}
	console.log('overlay date' , overlay.date);
	overlay['photoTime'] = overlay.date.toISOString();
	let promiseResp;
	switch (fields.sensorType) {
		case sensorTypes.DroneImagery:
			promiseResp = droneImagery(fields.file, fields.sharing);
			break;
		case sensorTypes.Mobile:
			promiseResp = Promise.resolve({ type: 'mobile' }); //TODO: implement Mobile upload
			break;

		case sensorTypes.DroneMap:
			promiseResp = Promise.resolve({ type: 'DronMap' }); //TODO: implement Drone map upload
			break;

		case sensorTypes.Satellite:
			promiseResp = Promise.resolve({ type: 'satellite' }); //TODO: implement Satellite upload
			break;
	}

	promiseResp.then(overlayResp => {
		Object.assign(overlay, overlayResp);
		overlay['imageUrl'] = `${config.geoserver.url}/${fields.sharing}/wms`;
		const { bbox } = overlayResp.tag.bbox;
		overlay['thumbnailUrl'] `${overlay.imageUrl}?${config.geoserver.wmsThumbnailParams.start}&bbox=${bbox.minx},${bbox.miny},${bbox.maxx},${bbox.maxy}&srs=${overlay.tag.projection}${config.geoserver.wmsThumbnailParams.end}`;
		console.log('final overlay: ' , overlay);
		createNewLayer(overlay, fields.sharing);
		return res.json(overlay);
	})
		.catch(err => res.status(500).send(err.message));
};

module.exports = {
	addLayer
};
