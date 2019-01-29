module.exports = {
  appPort: 10010,
  paths: {
    swaggerUi: '/'
  },
  remote: {
    localDomain: 'http://127.0.0.1',
    domain: 'http://tb-server.webiks.com',
    baseUrl:  process.env.NODE_ENV === 'production' ? 'http://tb-server.webiks.com' : 'http://127.0.0.1',
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
    name: 'tb',
    url: 'mongodb://ansyn.webiks.com:85'
  },
  login: {
    usernameKey: 'TB_USERNAME',
    passwordKey: 'TB_PASSWORD'
  },
  geoserver: {
    port: 8080,
    path: 'geoserver',
    workspaces: 'geoserver/rest/workspaces',
    imports: 'geoserver/rest/imports',
    getLayerUrl: 'api/gsLayers/layer',
    wmsThumbnailParams: {
      start: '?service=WMS&version=1.1.0&request=GetMap&transparent=true&layers=',
      end: '&styles=&width=256&height=256&format=image/jpeg'
    },
    wmtsServiceUrl: 'gwc/service/wmts?SERVICE=wmts&REQUEST=getcapabilities&VERSION=1%2E0%2E0',
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
