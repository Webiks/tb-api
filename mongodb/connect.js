const config = require('../config/config');
const globals = require('../config/globals');
const MongoClient = require('mongodb').MongoClient;
const url = config.mongodb.url;
const dbName = config.mongodb.name;

const connectMongodb = () => {
	MongoClient.connect(url, function(err, client) {
		if (err) {
			console.log(`Failed to Connected to mongodb`)
		} else {
			globals.db = client.db(dbName);
			console.log(`Connected to mongodb on ${url}/${dbName}`);
		}
	});
};


module.exports = connectMongodb;
