const s3 = require('./getS3Object');

class S3Utils {

	// upload file to S3
	static s3Upload(fileKey, buffer) {
		const params = {
			Key: fileKey,
			Body: buffer,
			ACL: 'public-read'
		};
		// upload the file to s3 and return its location
		return s3.upload(params).promise()
			.then(data => {
				console.log(`Successfully uploaded file to ${data.Location}`);
				return data.Location;
			})
			.catch(err => {
				console.error(err, err.stack);
				throw new Error(err);
			});
	}

	// download file from S3
	static s3Download(fileKey) {
		const params = {
			Key: fileKey
		};
		// download the file from s3 and return its buffer
		return s3.getObject(params).promise()
			.then(data => {
				console.log(`Successfully download file from ${fileKey}`);
				return data.Body;
			})
			.catch(err => {
				console.error(err, err.stack);
				throw new Error(err);
			});
	}

}


module.exports = S3Utils;
