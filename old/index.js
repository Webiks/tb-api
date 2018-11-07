const express = require('express');
const cors = require('cors');
const api = require('./src/api/index');
const login = require('./src/login/index');
const bodyParser = require('body-parser');
const session = require('express-session');
const checkAuth = require('./src/login/check-auth');
const DBManager = require('./src/database/DBManager');

const app = express();

require('./src/config/serverConfig')();
const configParams = config().configParams;

app.use(cors({ credentials: true, origin: true }));
app.use(bodyParser.json());

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

// start the App server
app.listen(configParams.serverPort, () => console.log('listen to ', configParams.serverPort));


module.exports = {
	app
};
