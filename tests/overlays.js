const Server = require('../src/server');
const rp = require('request-promise');
const { mongo } = require('../config/globals');

describe('overlays', () => {
	let server = new Server();

	const query = {
		'worldName': 'public',
		'geometry': {
			'type': 'Polygon',
			'coordinates': [
				[
					[
						34.46960449218749,
						31.774877618507386
					],
					[
						35.4473876953125,
						31.774877618507386
					],
					[
						35.4473876953125,
						32.773419354975175
					],
					[
						34.46960449218749,
						32.773419354975175
					],
					[
						34.46960449218749,
						31.774877618507386
					]
				]
			]
		},
		'dates': {
			'start': '2019-03-01T00:00:00.000Z',
			'end': '2019-03-30T13:01:15.537Z'
		},
		'queries': [
			{
				'field': 'overlay.sensorType',
				'values': ['test'],
				'isMatch': true
			}
		]
	};

	const fakeLayer = {
		_id: '12345',
		overlay: {
			id: '12345',
			date: 1553846921109,
			photoTime: '2019-03-29T08:08:41.109Z',
			name: 'Jasmin Test',
			footprint: {
				type: 'Polygon',
				coordinates: [
					[
						[
							34.793701171875,
							32.319633552035214
						],
						[
							34.8870849609375,
							32.319633552035214
						],
						[
							34.8870849609375,
							32.40779154205701
						],
						[
							34.793701171875,
							32.40779154205701
						],
						[
							34.793701171875,
							32.319633552035214
						]
					]
				]
			},
			sensorType: 'test',
			sensorName: 'test',
			imageUrl: 'http://localhost',
			thumbnailUrl: 'http://localhost',
			isGeoRegistered: true,
			creditName: 'Test',
			tag: {}
		},
		uploadDate: '2019-04-18T08:08:41.109Z'
	};

	const MOCK_LAYERS = [fakeLayer];

	beforeEach(async () => {
		await server.run();
		await new Promise(resolve => mongo.db.collection(mongo.collections.OVERLAYS).insertMany(MOCK_LAYERS, resolve));
	});

	afterEach(async () => {
		await new Promise(resolve => mongo.db.dropDatabase(resolve));
		await server.stop();
	});

	it('Should get fake layer by id', (done) => {
		rp({
			method: 'GET',
			uri: `${server.baseUrl}/v2/api/layers/12345`,
			json: true,
		})
			.then((result) => {
				expect(result).toEqual(fakeLayer);
				done();
			});
	});

	it('Should get fake layer by query', (done) => {
		rp({
			method: 'POST',
			uri: `${server.baseUrl}/v2/api/layers`,
			json: true,
			body: query
		})
			.then((result) => {
				expect(Array.isArray(result)).toEqual(true);
				expect(result[0]).toEqual(fakeLayer);
				done();
			});
	});
});
