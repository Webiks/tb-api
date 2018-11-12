// the index file before the swagger
const express = require('express');
const cors = require('cors');
const http = require ('http');
const api = require('./src/api/index');
const login = require('./src/login/index');
const bodyParser = require('body-parser');
const session = require('express-session');
const checkAuth = require('./src/login/check-auth');
const DBManager = require('./src/database/DBManager');
const { appPort, mongodb } = require('./config/config');

const app = express();
const server = http.createServer(app);

app.use(cors({ credentials: true, origin: true }));
app.use(bodyParser.json());

// DB Connection URL
const url = `${mongodb.url}/${mongodb.name}`;

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
server.listen(appPort, () => console.log('listen to ', appPort));

module.exports = {
	server,
	app
};
