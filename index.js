'use strict';

const SwaggerExpress = require('swagger-express-mw');
const SwaggerUi = require('swagger-tools/middleware/swagger-ui');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');

const { appPort, mongodb, swagger } = require('./config/config');
const api = require('./src/api/index');
const login = require('./src/login/index');
const DBManager = require('./src/database/DBManager');

const app = express();

app.use(cors({ credentials: true, origin: true }));
app.use(bodyParser.json());

const yamls = express();
const swaggerUi = express();

const config = {
	appRoot: __dirname
};

/* yamls */
yamls.use(cors());
yamls.use(swagger.yamls.path, express.static(__dirname + swagger.yamls.staticUrl));
yamls.listen(swagger.yamls.port, () => {
	console.log(`Yamls listen on port: ${swagger.yamls.port}`);
});

SwaggerExpress.create(config, function (err, swaggerExpress) {
	if (err) {
		throw err;
	}

	/* swaggerUi */
	swaggerUi.use(SwaggerUi(swaggerExpress.runner.swagger));
	swaggerExpress.register(swaggerUi);
	swaggerUi.use(cors());
	swaggerUi.listen(swagger.port, () => {
		console.log(`Swagger-ui available on ${swagger.port}, on: http://localhost:${swagger.port}/docs`);
	});

});

function initializeApp(app) {

	// DB Connection URL
	const url = `${mongodb.url}/${mongodb.name}`;

	// start the connection to the mongo Database
	DBManager.connect(url).catch(() => {
		console.log("No connection for mongo!")
	});

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

	// start the App server
	app.listen(appPort, () => console.log('listen to ', appPort));

}

initializeApp(app);
