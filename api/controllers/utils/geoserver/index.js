const turf = require('@turf/turf');
const rp = require('request-promise');
const config = require('../../../../config/config');
const headers = { 'Authorization': config.geoserver.Auth };

const buildThumbnailUrl = (overlay) => {
	const { bbox } = overlay.tag;
	const BBOX = `${bbox.minx},${bbox.miny},${bbox.maxx},${bbox.maxy}`;
	return `${overlay.imageUrl}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image%2Fjpeg&TRANSPARENT=true&tiled=true&LAYERS=${overlay.tag.geoserver.layer.resource.name}&exceptions=application%2Fvnd.ogc.se_inimage&tilesOrigin=-57.710227986794244%2C-31.98336391045549&WIDTH=256&HEIGHT=256&SRS=${overlay.tag.projection}&STYLES=&BBOX=${BBOX}`;
};

const _fetchBBOXuri = ({ id, tag }) => `http://localhost:8080/geoserver/rest/workspaces/${tag.geoserver.workspace}/coveragestores/${id}.tiff/coverages/${tag.name}.json`;

const fetchBBOX = (overlay) => {
	return rp({
		uri: _fetchBBOXuri(overlay),
		method: 'GET',
		json: true,
		headers
	}).then(({ coverage: { latLonBoundingBox: bbox } }) => {
		const { minx, miny, maxx, maxy } = bbox;
		const footprint = turf.bboxPolygon([minx, miny, maxx, maxy]).geometry;
		const tag = {...overlay.tag, bbox };
		return { ...overlay, footprint, tag };
	});
}


module.exports = { buildThumbnailUrl, fetchBBOX };
