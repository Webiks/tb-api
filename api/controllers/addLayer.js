const sensorTypes = require('../swagger/config/paths/layer/sensorTypes');
const droneImagery = require('./addLayer/droneImagery');
const addLayer = async (req, res) => {
	const fields = {};
	Object.entries(req.swagger.params).forEach(([key, value]) => {
		fields[key] = value.value;
	});
	console.log('fields: ' , fields);
	const { file } = fields;
	let overlay = {
		name: file.originalname,
		sensorType: fields.sensorType,
		sensorName: fields.sensorName,
		creditName: fields.creditName,
		date: fields.date? new Date(fields.date) : new Date(),
	};
	overlay['photoTime'] = overlay.date.toISOString();
	try {
		switch (fields.sensorType) {
			case sensorTypes.DroneImagery:
			 		Object.assign(overlay , await droneImagery(fields.file, fields.sharing));
				break;
			case sensorTypes.Mobile:

				break;

			case sensorTypes.DroneMap:

				break;

			case sensorTypes.Satellite:
				break;
		}
		res.json(overlay);
	} catch (err) {
		res.status(500).json({ error: err.message, _error: err });
	}
};

module.exports = {
	addLayer
};
