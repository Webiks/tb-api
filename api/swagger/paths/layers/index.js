const layersPayload = require('./schema/layers-payload');

module.exports = {
	'x-swagger-router-controller': 'layers',

	post: {
		tags: ['Layers'],
		description: 'Fetch layers for ansyn.',
		operationId: 'fetchLayers',
		parameters: [
			{
				name: 'payload',
				description: 'The name of the world',
				in: 'body',
				required: true,
				schema: layersPayload
			}
		],
		responses: {
			200: {
				description: 'Fetch Success',
				schema: {
					type: 'array',
					items: { 'type': 'object' }
				}
			},
			default: {
				description: 'Error',
				schema: {
					"required": ["message"],
					"properties": {
						"message": {
							"type": "string"
						}
					}
				}
			}
		}
	}
};
