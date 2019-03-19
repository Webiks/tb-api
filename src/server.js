'use strict';
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const { appPort, remote: { baseUrl } } = require('../config/config');
const domain = `${ baseUrl }:${ appPort }`;
const swaggerTools = require('swagger-tools');
const swaggerDoc = require('../config/swagger');
const config = require('../config/config');
const { mongo } = require('../config/globals');
const { MongoClient } = require('mongodb');

const mongoUrl = config.mongodb.url;
const dbName = config.mongodb.name;

class Server {
	constructor() {
		this.app = express();
		this.baseUrl = domain;
		this.app.use(bodyParser.json());
		this.app.use(cors());
		this.app.use(session({
			secret: 'keyboard cat',
			resave: false,
			saveUninitialized: true,
			cookie: {
				secure: false
			}
		}));
	}

	async run() {
		await this.initSwagger(this.app);
		await this.connectMongodb();
		await this.listen();
	}

	connectMongodb() {
		return new Promise((resolve, reject) => {
			MongoClient.connect(mongoUrl, { useNewUrlParser: true }, (err, client) => {
				if (err) {
					console.log('Failed to Connected to mongodb');
					reject();
				} else {
					mongo.client = client;
					mongo.db = client.db(dbName);
					console.log(`MongoDB available on ${ mongoUrl }`);
					resolve();
				}
			});
		});
	}

	disconnectMongodb() {
		return new Promise((resolve, reject) => {
			mongo.client.close((err) => {
				if (err) {
					reject();
				} else {
					console.log(`Closing MongoDB on ${ mongoUrl }`);
					resolve();
				}
			});
		});
	}

	initSwagger() {
		return new Promise((resolve) => {
			swaggerTools.initializeMiddleware(swaggerDoc, (middleware) => {

				this.app.use(middleware.swaggerMetadata());

				this.app.use(middleware.swaggerValidator({
					validateResponse: false
				}), (err, req, res, next) => {
					if (err) {
						res.status(500).send({ error: err });
					}
				});

				this.app.use(middleware.swaggerRouter({
					controllers: './src/controllers'
				}));

				if (process.ENV.NODE_ENV !== 'production') {
					this.app.use(middleware.swaggerUi({ swaggerUi: '/' }));
				}

				resolve();
			});
		});
	}

	listen() {
		return new Promise(resolve => {
			this.server = this.app.listen(appPort, () => {
				console.log(`Swagger-ui available on: ${ this.baseUrl }`);
				resolve();
			});
		});
	}

	close() {
		return new Promise(resolve => {
			this.server.close(() => {
				console.log(`Closing the server on: ${ this.baseUrl }`);
				resolve();
			});
		});
	}

	async stop() {
		await this.disconnectMongodb();
		await this.close();
	}

}

module.exports = Server;
