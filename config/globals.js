const globals = {
	mongo: {
		db: null,
		client: null,
		collections: {
			OVERLAYS: 'overlays',
			USERS: 'users',
			LOG: 'logs'
		}
	}
};

module.exports = globals;
