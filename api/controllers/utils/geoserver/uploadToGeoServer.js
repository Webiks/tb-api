const rp = require('request-promise');
const { geoserver } = require('../../../../config/config');
const createOption = (additional,method) => ({
	...additional,
	method: method ? method : 'POST',
	json: true,
	headers: {
		'Authorization': geoserver.Auth
	},
});

const uploadToGeoserver = async (workspace, buffer, name) => {
	console.log('upload to geoserver');
	let resp = {
		geoserver: {},
		tag: {
			fileType: '',
			bbox: {},
			projection: '',
			geoserver: { layer: { resource: { name: '' } } },
			imageData: {ExifImageHeight: 0, ExifImageWidth: 0}
		}
	};
	let openImports = createOption({
		uri: geoserver.url + geoserver.imports,
		body: {
			import: { targetWorkspace: { workspace: { name: workspace } } }
		}
	});

	let { import: reqImport } = await rp(openImports);
	console.log('reqImport: ', reqImport);
	resp.geoserver['id'] = reqImport.id;
	let baseTasks = reqImport.href;
	let uploadImageTask = createOption({
		uri: `${baseTasks}/tasks`,
		formData: {
			upload: {
				value: Buffer.from(buffer),
				options: {
					filename: `${name}.tif`,
					ContentType: 'image/tif'
				}
			},
		}
	});
	let { task: finalResp } = await rp(uploadImageTask);
	console.log('finalResp', finalResp);
	resp.geoserver.task = finalResp.id;
	resp.tag.fileType = finalResp.data.format;
	await rp(createOption({ uri: baseTasks }));
	let { layer } = await rp(createOption({
		uri: finalResp.layer.href,
	}, 'GET'));
	console.log('layer', layer);
	resp.tag.bbox = layer.bbox;
	resp.tag.projection = layer.srs;
	resp.tag.geoserver.layer.resource.name = `${workspace}:${layer.name}`;
	return resp;
};

module.exports = uploadToGeoserver;
