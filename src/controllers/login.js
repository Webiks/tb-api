const AnsynJwt = require('./utils/ansynJwt');
const uuid = require('uuid');
const { mongo } = require('../../config/globals');

const ansynJwt = new AnsynJwt();
const updateLog = (user, req) => {
	mongo.db.collection(mongo.collections.LOG).updateOne({ _id: user.id },
		{
			$set: {
				user: user.username,
				ip: req.headers['ansyn-user-id'],
			},
			$push: { timestamp: new Date().getTime() }
		},
		{ upsert: true }
	);
};
const login = (req, res) => {
	const { value: { username, password } } = req.swagger.params.payload;
	mongo.db.collection(mongo.collections.USERS).findOne({ _id: username.toLowerCase(), password }, (err, user) => {
		if (err) {
			res.status(500).send({ message: err });
		} else if (!user) {
			res.status(401).send({ message: 'UnAuthorized' });
		} else {
			const [alg, typ] = ['HS256', 'JWT'];
			const header = { alg, typ };
			const [username, role, id] = [user.username, user.role, uuid()];
			const payload = { username, role, id };
			const authToken = ansynJwt.createJWT(header, payload);
			//updateLog(payload, req);
			res.json({ authToken, data: user });
		}
	});
};

const loginAuth = (req, res) => {
	const [authToken] = [req.swagger.params.payload.value.authToken];
	const isValidToken = ansynJwt.check(authToken);
	if (isValidToken) {
		const data = ansynJwt.getPayload(authToken);
		if (Date.now() < data.exp) {
			updateLog(data, req);
			res.json({ authToken, data });
			return;
		}
	}

	res.status(401).send({ message: 'UnAuthorized' });
};


module.exports = { login, loginAuth };
