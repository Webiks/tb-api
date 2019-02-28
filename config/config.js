module.exports = {
	appPort: 10010,
	paths: {
		swaggerUi: '/'
	},
	remote: {
		localDomain: 'http://127.0.0.1',
		domain: 'http://tb-server.webiks.com',
		baseUrl: process.env.GEO_SERVER_URL || (process.env.NODE_ENV === 'production' ? 'http://tb-server.webiks.com' : 'http://127.0.0.1'),
		droneDomain: 'http://drone-geo-referencer.webiks.com/v1/api/',
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
		name: process.env.MONGO_DB || 'tb',
		url: process.env.MONGO_URL || 'mongodb://ansyn.webiks.com:85' 
	},
	login: {
		usernameKey: 'TB_USERNAME',
		passwordKey: 'TB_PASSWORD'
	},
	geoserver: {
		url: 'http://geoserver.tb-server.webiks.com/geoserver',
		port: process.env.GEO_SERVER_PORT || 8080,
		path: 'geoserver',
		workspaces: 'geoserver/rest/workspaces',
		imports: 'geoserver/rest/imports',
		getLayerUrl: 'api/gsLayers/layer',
		wmsThumbnailParams: {
			start: '?service=WMS&version=1.1.0&request=GetMap&transparent=true&layers=',
			end: '&styles=&width=256&height=256&format=image/jpeg'
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
