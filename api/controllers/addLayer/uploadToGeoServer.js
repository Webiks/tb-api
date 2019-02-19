const rp = require('request-promise');
const { geoserver } = require('../../../config/config');
const baseOpt = {
	method: 'POST',
	json: true,
	headers: {
		'Authorization': geoserver.Auth
	}
};

const uploadToGeoserver = (workspace, buffer, name) => {
	let resp = {};
	let openImports = Object.assign(baseOpt, {
		uri: geoserver.url + geoserver.imports,
		body: {
			import: { targetWorkspace: { workspace: { name: workspace } } }
		}
	});

	return rp(openImports).then(({ import: reqImport }) => {
		let baseTasks = reqImport.href;
		let uploadImageTask = Object.assign(baseOpt, {
			uri: `${baseTasks}/tasks`, formData: {
				image: {
					value: Buffer.from(buffer),
					options: {
						filename: name,
						contentType: 'image/tiff'
					}
				}
			}
		});
		return rp(uploadImageTask).then(finalResp => {
			resp['fileType'] = finalResp.data.format;
			return rp({
				uri: finalResp.layer.href,
				headers: { 'Authorization': geoserver.Auth },
				json: true
			}).then(({ layer }) => {
				resp['bbox'] = layer.bbox;
				resp['projection'] = layer.srs;
				return rp(Object.assign(baseOpt, {uri: baseTasks})).then( () => resp);
			});
		});
	});
};

module.exports = uploadToGeoserver;
