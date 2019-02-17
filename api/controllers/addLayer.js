const sensorTypes = require('../swagger/config/paths/layer/sensorTypes');
const droneImagery = require('./addLayer/droneImagery');

const addLayer = async (req, res) => {
	const fields = {};
	Object.entries(req.swagger.params).forEach(([key, value]) => {
		fields[key] = value.value;
	});

	let result;
	try {
		switch (fields.sensorType) {
			case sensorTypes.DroneImagery:
				result = await droneImagery(fields);
				break;
			case sensorTypes.Mobile:
				break;

			case sensorTypes.DroneMap:
				break;

			case sensorTypes.Satellite:
				break;
		}
		res.json(result);
	} catch (err) {
		res.status(500).json({ error: err.message, _error: err });
	}
};

module.exports = {
	addLayer
};
