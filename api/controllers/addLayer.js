const sensorTypes = require('../swagger/config/paths/layer/sensorTypes');
const droneImagery = require('./addLayer/droneImagery');

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
		date: fields.date ? new Date(fields.date) : new Date()
	};
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
		console.log('final overlay: ' , overlay);
		return res.json(overlay);
	})
		.catch(err => res.status(500).send(err.message));
};

module.exports = {
	addLayer
};
