'use strict';

const SwaggerExpress = require('swagger-express-mw');
const express = require('express');
const app = express();
const SwaggerUi = require('swagger-tools/middleware/swagger-ui');

module.exports = app; // for testing

const config = {
  appRoot: __dirname // required config
};

SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) { throw err; }

  // Add swagger-ui (This must be before swaggerExpress.register)
  app.use(SwaggerUi(swaggerExpress.runner.swagger));

  // install middleware
  swaggerExpress.register(app);

  const port = process.env.PORT || 10010;
  app.listen(port, () => {
  	console.log('listen to ', port);
	});

  if (swaggerExpress.runner.swagger.paths['/hello']) {
    console.log('try this:\ncurl http://127.0.0.1:' + port + '/hello?name=Scott');
  }

	app.use('/yamls', express.static('api/yamls'));

});
