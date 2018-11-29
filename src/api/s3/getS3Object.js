const aws = require('aws-sdk');
const S3 = require('aws-sdk/clients/s3');
const { s3config } = require('../../../config/config');

// create a Logger
aws.config.logger = console;

// configure the s3 service object
aws.config.update({
	credentials: {
		accessKeyId: process.env[s3config.accessKeyId],
		secretAccessKey: process.env[s3config.secretAccessKey]
	},
	region: process.env[s3config.region]
});

// create the s3 bucket instance
const s3 = new aws.S3({
	apiVersion: s3config.apiVersion.s3,
	params: {
		Bucket: s3config.bucketName
	}
});

module.exports = { s3, aws };
