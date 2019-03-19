const login = {
	'x-swagger-router-controller': 'login',

	post: {
		tags: ['Login'],
		description: 'login by username, password and rememeber-me. on success should send valid jwtToken.',
		operationId: 'login',
		parameters: [
			{
				name: 'payload',
				description: 'Login by username and password',
				in: 'body',
				required: true,
				schema: {
					type: 'object',
					description: 'login by username, password and rememeber-me.  should send valid jwtToken.',
					required: [
						'username',
						'password'
					],
					properties: {
						username: {
							type: 'string',
							description: 'Username'
						},
						password: {
							type: 'string',
							description: 'password'
						}
					}

				}
			}
		],
		responses: {
			'200': {
				description: 'Login success'
			}
		}
	}
};

module.exports = login;
