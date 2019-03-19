const Server = require('../src/server');
const rp = require('request-promise');
const { mongo } = require('../config/globals');

describe('login', () => {
	let server = new Server();

	const fakeUser = {
		_id: 'fakeuser',
		username: 'fakeuser',
		password: 'fakeuserPassword'
	};

	const MOCK_USERS = [fakeUser];

	beforeEach(async () => {
		await server.run();
		await new Promise(resolve => mongo.db.collection(mongo.collections.USERS).insertMany(MOCK_USERS, resolve));
	});

	afterEach(async () => {
		await new Promise(resolve => mongo.db.dropDatabase(resolve));
		await server.stop();
	});

	it('Should success login (200) on correct username and password', (done) => {
		rp({
			method: 'POST',
			uri: `${ server.baseUrl }/v2/api/login`,
			json: true,
			body: {
				username: 'fakeuser',
				password: 'fakeuserPassword'
			}
		})
			.then((result) => {
				expect(typeof result.authToken).toEqual('string');
				expect(result.data).toEqual(fakeUser);
				done();
			});
	});

	it('Should get UnAuthorized(401) on incorrect username or password', (done) => {
		rp({
			method: 'POST',
			uri: `${ server.baseUrl }/v2/api/login`,
			json: true,
			body: {
				username: 'string',
				password: 'string'
			}
		})
			.catch((result) => {
				console.log(result.response.body);
				expect(result.response.body).toEqual({ message: 'UnAuthorized' });
				done();
			});
	});

});
