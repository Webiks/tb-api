'use strict';
const SwaggerExpress = require('swagger-express-mw');
const SwaggerUi = require('swagger-tools/middleware/swagger-ui');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const $RefParser = require('json-schema-ref-parser');
const JsonRefs = require('json-refs');
const YAML = require('js-yaml');
const { mongodb, appPort, remote } = require('./config/config');
const api = require('./src/api/index');
const login = require('./src/login/index');
const DBManager = require('./src/database/DBManager');

// JsonRefs.resolveRefsAt('./api/swagger/swagger.yaml', {
// 	filter: ['relative', 'remote'],
// 	loaderOptions: {
// 		processContent: (res, cb) => cb(undefined, YAML.safeLoad(res.text))
// 	}
// })
// JsonRefs.resolveRefsAt('./api/swagger/swagger.json', {
// 	filter: ['relative', 'remote'],
// 	loaderOptions: {
// 		processContent: (res, cb) => cb(undefined, YAML.safeLoad(res, { schema: 'JSON_SCHEMA'}))
// 	}
// })
JsonRefs.resolveRefsAt('./api/swagger/swagger.json', {filter: ['relative', 'remote']})
//$RefParser.dereference('./api/swagger/swagger.json')
	.then(results => {
		const app = express();
		const config = {
			appRoot: __dirname,
			swagger: results.resolved
		};
		console.log(`config appRoot: ${config.appRoot}`);
		console.log(`config swagger: ${JSON.stringify(config.swagger)}`);

		SwaggerExpress.create(config, function (err, swaggerExpress) {
			console.log(`start SwaggerExpress create...`);
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

