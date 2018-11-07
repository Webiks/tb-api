'use strict';

const SwaggerExpress = require('swagger-express-mw');
const SwaggerUi = require('swagger-tools/middleware/swagger-ui');
const express = require('express');
const cors = require('cors');
const formidable = require('express-formidable');
const { port, yamlsPort, yamlsPath } = require('./config/config');

const app = express();
doUploadFileStuff(app);

const yamls = express();

const config = {
	appRoot: __dirname
};

/* yamls */
yamls.use(cors());
yamls.use(yamlsPath, express.static(__dirname + '/api/yamls'));
yamls.listen(yamlsPort, () => {
	console.log(`Yamls listen on port: ${yamlsPort}`);
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
		console.log(`Swagger-ui available on ${port}, on: http://localhost:${port}/docs`);
	});

});

function doUploadFileStuff(app) {
	const uploadPath = `${__dirname.replace(/\\\\/g, '/')}/old/src/api/upload/public/uploads/` ;

	const options =  {
		encoding: 'utf-8',
		maxFileSize: 50000000000,
		uploadDir: uploadPath,
		multiples: true,
		keepExtensions: true
	};

	app.use((req, res, next) => {
		if (req.url.includes('/api/ansyn/upload/')) {
			formidable(options)(req, res, next)
		} else {
			next();
		}
	});

}
