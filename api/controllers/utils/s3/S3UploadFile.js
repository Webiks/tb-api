const s3 = require('./getS3Object');

const s3UploadFile = (name, buffer) => {
	return s3.upload({
		Key: `layers/${name}`,
		Body: buffer,
		ACL: 'public-read'
	}).promise().then(({ Location }) => Location);
};


module.exports = s3UploadFile;
