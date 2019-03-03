const config = require('../config/config');
const globals = require('../config/globals');
const MongoClient = require('mongodb').MongoClient;
const url = config.mongodb.url;
const dbName = config.mongodb.name;
const DBManager = require('../src/database/DBManager');

const connectMongodb = () => {
	MongoClient.connect(url, (err, client) => {
		if (err) {
			console.log('Failed to Connected to mongodb');
		} else {
			globals.mongo.client = client;
			globals.mongo.db = client.db(dbName);
			console.log(`Connected to mongodb on ${url}/${dbName}`);
		}
	});

	DBManager.connect(`${url}/${dbName}`).catch(() => {
		console.log('No connection for mongo!');
	});

};


module.exports = connectMongodb;
