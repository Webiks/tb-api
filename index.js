'use strict';

const SwaggerExpress = require('swagger-express-mw');
const SwaggerUi = require('swagger-tools/middleware/swagger-ui');
const express = require('express');
const cors = require('cors');
const formidable = require('express-formidable');
const bodyParser = require('body-parser');
const session = require('express-session');

const { port, yamlsPort, yamlsPath } = require('./config/config');
const api = require('./src/api/index');
const login = require('./src/login/index');
const checkAuth = require('./src/login/check-auth');
const DBManager = require('./src/database/DBManager');
const { configParams } = require('./config/serverConfig');

const app = express();

app.use(cors({ credentials: true, origin: true }));
app.use(bodyParser.json());

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

function initializeOld(app) {

// DB Connection URL
	const url = `${configParams.mongoBaseUrl}/${configParams.dbName}`;

// start the connection to the mongo Database
	DBManager.connect(url);

// define the session
	app.use(session({
		secret: 'keyboard cat',
		resave: false,
		saveUninitialized: true,
		cookie: {
			secure: false
		}
	}));

	app.use('/login', login);
// app.use('/api', checkAuth);
	app.use('/api', api);

}

initializeOld(app);
