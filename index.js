'use strict';
const SwaggerExpress = require('swagger-express-mw');
const SwaggerUi = require('swagger-tools/middleware/swagger-ui');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const $RefParser = require('json-schema-ref-parser');
const { mongodb, appPort, remote } = require('./config/config');
const api = require('./src/api/index');
const login = require('./src/login/index');
const DBManager = require('./src/database/DBManager');

$RefParser.dereference('./api/swagger/swagger.json')
	.then(results => {
		const app = express();
		const config = {
			appRoot: __dirname,
			swagger: results
		};

		SwaggerExpress.create(config, function (err, swaggerExpress) {
			if (err) {
				throw err;
			}

			/* swaggerUi */
			app.use(SwaggerUi(swaggerExpress.runner.swagger));
			swaggerExpress.register(app);

			/* v1 api - no swagger */

			// DB Connection URL
			const url = `${mongodb.url}/${mongodb.name}`;

			// start the connection to the mongo Database
			DBManager.connect(url).catch(() => {
				console.log('No connection for mongo!');
			});
			app.use(cors({ credentials: true, origin: true }));
			app.use(bodyParser.json());

			app.use(session({
				secret: 'keyboard cat',
				resave: false,
				saveUninitialized: true,
				cookie: {
					secure: false
				}
			}));

			app.use('/login', login);
			app.use('/v1/api', api);

			app.listen(appPort, () => {
				console.log(`Swagger-ui available on ${appPort}, on: ${remote.serverDomain}/docs`);
			});

		});
	})
	.catch(err =>  console.log(err));

