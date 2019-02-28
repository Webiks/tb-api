const turf = require('@turf/turf');
const rp = require('request-promise');
const config = require('../../../../config/config');
const headers = { 'Authorization': config.geoserver.Auth };

const buildThumbnailUrl = (overlay) => {
	const { nativeBoundingBox } = overlay.tag;
	const BBOX = `${nativeBoundingBox.minx},${nativeBoundingBox.miny},${nativeBoundingBox.maxx},${nativeBoundingBox.maxy}`;
	return `${overlay.imageUrl}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image%2Fjpeg&TRANSPARENT=true&tiled=true&LAYERS=${overlay.tag.geoserver.layer.resource.name}&exceptions=application%2Fvnd.ogc.se_inimage&tilesOrigin=-57.710227986794244%2C-31.98336391045549&WIDTH=256&HEIGHT=256&SRS=${overlay.tag.projection}&STYLES=&BBOX=${BBOX}`;
};

const _fetchBBOXuri = ({ id, tag }) => `${config.geoserver.url}/rest/workspaces/${tag.geoserver.workspace}/coveragestores/${id}.tiff/coverages/${tag.name}.json`;

const fetchBBOX = (overlay) => rp({
	uri: _fetchBBOXuri(overlay),
	method: 'GET',
	json: true,
	headers
}).then(({ coverage: { latLonBoundingBox: bbox, nativeBoundingBox } }) => {
	nativeBoundingBox.crs = nativeBoundingBox.crs.$ || nativeBoundingBox.crs;
	const { minx, miny, maxx, maxy } = bbox;
	const footprint = turf.bboxPolygon([minx, miny, maxx, maxy]).geometry;
	const tag = {...overlay.tag, bbox, nativeBoundingBox };
	return { ...overlay, footprint, tag };
});


module.exports = { buildThumbnailUrl, fetchBBOX };
