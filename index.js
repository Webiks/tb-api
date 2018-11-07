'use strict';

const SwaggerExpress = require('swagger-express-mw');
const SwaggerUi = require('swagger-tools/middleware/swagger-ui');
const express = require('express');
const cors = require('cors');
const { port, yamlsPort, yamlsPath } = require('./config/config');

const app = express();
const yamls = express();

const config = {
	appRoot: __dirname
};

/* yamls */
yamls.use(cors());
yamls.use(yamlsPath, express.static(__dirname + '/api/yamls'));
yamls.listen(yamlsPort, () => {
	console.log(`Yamls listener is up port ${yamlsPort}`);
});

SwaggerExpress.create(config, function (err, swaggerExpress) {
	if (err) {
		throw err;
	}

	/* app */
	app.use(SwaggerUi(swaggerExpress.runner.swagger));
	swaggerExpress.register(app);
	app.use(cors());
	app.listen(port, () => {
		console.log(`Swagger-ui is available on http://localhost:${port}/docs`);
	});


});
