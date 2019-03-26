module.exports = {
	appPort: 10010,
	paths: {
		swaggerUi: '/'
	},
	remote: {
		localDomain: 'http://127.0.0.1',
		domain: 'http://api.ansyn.webiks.com',
		gdal: process.env.GDAL_URL || 'http://localhost:8888/upload/',
		baseUrl: process.env.NODE_ENV === 'production' ? 'http://api.ansyn.webiks.com' : 'http://127.0.0.1',
		droneDomain: process.env.DRONE_URL || 'http://localhost:8081/v1/api/',
		gsDatadir: 'D:/GeoServer/data_dir'
	},
	s3config: {
		accessKeyId: 'AWS_ACCESS_KEY_ID',
		secretAccessKey: 'AWS_SECRET_ACCESS_KEY',
		region: 'AWS_REGION',
		apiVersion: {
			s3: '2006-03-01',
			ec2: '2016-11-15'
		},
		bucketName: 'tb-webiks'
	},
	mongodb: {
		port: 85,
		name: process.env.MONGO_DB || 'test',
		url: process.env.MONGO_URL || 'mongodb://localhost:27017'
	},
	login: {
		usernameKey: 'TB_USERNAME',
		passwordKey: 'TB_PASSWORD'
	},
	geoserver: {
		url: process.env.GEO_SERVER_URL || 'http://localhost:8080/geoserver',
		workspaces: '/rest/workspaces',
		imports: '/rest/imports',
		Auth: `Basic ${Buffer.from(`${process.env.GEO_SERVER_USER || 'admin'}:${process.env.GEO_SERVER_PASS || 'geoserver'}`).toString('base64')}`,
		wmsThumbnailParams: {
			start: '?service=WMS&version=1.1.1&request=GetMap&transparent=true&layer=',
			end: 'width=256&height=256&format=image/jpeg'
		},
		baseCurl: 'curl -u admin:geoserver'
	},
	upload: {
		headers: {
			authorization: 'Basic YWRtaW46Z2Vvc2VydmVy',
			'Content-Type': 'application/json',
			accept: 'application/json'
		},
		maxFileSize: 50000000000,
		defaultWorldId: 'public'
	},
	ansyn: {
		droneFootPrintPixelSize: 200,
		mobileFootPrintPixelSize: 100
	}
};
