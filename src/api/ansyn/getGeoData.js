const turf = require('@turf/turf');

const getGeoDataFromPoint = (point, pixelSize) => {
	console.log('setGeoData center point: ', JSON.stringify(point));
	// get the Bbox
	const bbox = getBboxFromPoint(point, pixelSize);
	console.log('setGeoData polygon: ', JSON.stringify(bbox));
	// get the footprint
	const footprint = getFootprint(bbox);
	console.log('setGeoData footprint: ', JSON.stringify(footprint));
	// set the geoData
	return { droneCenter: turf.point(point), footprint, bbox };
};

const getFootprint = (bbox) => {
	return turf.bboxPolygon(bbox);
};

// get the Boundry Box from a giving Center Point using turf
const getBboxFromPoint = (center, radius) => {
	const distance = radius / 1000; 					// the square size in kilometers
	const point = turf.point(center);
	const buffered = turf.buffer(point, distance, { units: 'kilometers', steps: 4 });
	return turf.bbox(buffered);
};

module.exports = {
	getGeoDataFromPoint,
	getFootprint
};

