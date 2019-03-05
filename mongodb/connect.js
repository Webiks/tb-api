const config = require('../config/config');
const { mongo } = require('../config/globals');
const { MongoClient } = require('mongodb')
const url = config.mongodb.url;
const dbName = config.mongodb.name;

const connectMongodb = () => {
	MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
		if (err) {
			console.log('Failed to Connected to mongodb');
		} else {
			mongo.client = client;
			mongo.db = client.db(dbName);

			console.log(`MongoDB available on ${url}`);
		}
	});
};


module.exports = connectMongodb;
