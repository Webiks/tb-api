const login = require('./login');
const loginAuth = require('./loginAuth');

const loginPaths = {
	'/login': login,
	'/login/authToken': loginAuth
};

module.exports = loginPaths;
