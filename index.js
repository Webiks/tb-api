'use strict';
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const { appPort, paths, remote: { baseUrl } } = require('./config/config');
const domain = `${baseUrl}:${appPort}`;
const initSwagger = require('./api/swagger/init');
const connectMongodb = require('./mongodb/connect');

const app = express();

initSwagger(app).then(() => {
	app.listen(appPort, () => {
		console.log(`Swagger-ui available on: ${domain}${paths.swaggerUi}`);
	});

	connectMongodb();

	app.use(bodyParser.json());
	app.use(cors());

	app.use(session({
		secret: 'keyboard cat',
		resave: false,
		saveUninitialized: true,
		cookie: {
			secure: false
		}
	}));
});

