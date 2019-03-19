const loginAuth = {
	'x-swagger-router-controller': 'login',
	post: {
		tags: ['Login'],
		description: 'login by authToken. on success should send valid jwtToken.',
		operationId: 'loginAuth',
		parameters: [
			{
				name: 'payload',
				description: 'Login by auth token',
				in: 'body',
				required: true,
				schema: {
					type: 'object',
					description: 'Login by auth token',
					required: ['authToken'],
					properties: {
						authToken: {
							type: 'string',
							description: 'authToken'
						}
					}

				}
			}
		],
		responses: {
			'200': {
				description: 'Login auth success'
			}
		}
	}
};

module.exports = loginAuth;
