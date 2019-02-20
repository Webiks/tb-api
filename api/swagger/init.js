const swaggerTools = require('swagger-tools');
const swaggerDoc = require('./config');
const cors = require('cors');

const initSwagger = (app) => new Promise((resolve) => {
	swaggerTools.initializeMiddleware(swaggerDoc, (middleware) => {
		app.use(cors());

		app.use(middleware.swaggerMetadata());

		app.use(middleware.swaggerValidator({
			validateResponse: false
		}));

		app.use(middleware.swaggerRouter({

			controllers: './api/controllers',
			useStubs: process.env.NODE_ENV === 'development' ? true : false
		}));

		app.use(middleware.swaggerUi({ swaggerUi: '/' }));

		resolve();

	});
});

module.exports = initSwagger;
