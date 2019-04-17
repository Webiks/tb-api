const aws = require('aws-sdk');
const { s3config } = require('../../../../config/config');

// create a Logger
aws.config.logger = console;

let myCredentials;
// get the credentials
if (process.env[s3config.accessKeyId] && process.env[s3config.secretAccessKey]) {
	// local - get credentials from the Environment Variables
	myCredentials = {
		accessKeyId: process.env[s3config.accessKeyId],
		secretAccessKey: process.env[s3config.secretAccessKey]
	};
} else {
	// remote - get temporary credentials from the ec2
	myCredentials = new aws.ECSCredentials({
		httpOptions: { timeout: 5000 }, // 5 second timeout
		maxRetries: 10, // retry 10 times
		retryDelayOptions: { base: 200 }
	});
}

// configure the s3 service object
aws.config.update({
	credentials: myCredentials,
	region: process.env[s3config.region]
});

// create the s3 bucket instance
const s3 = new aws.S3({
	apiVersion: s3config.apiVersion.s3,
	params: {
		Bucket: s3config.bucketName
	}
});

module.exports = s3;
