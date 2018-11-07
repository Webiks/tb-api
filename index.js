'use strict';

const SwaggerExpress = require('swagger-express-mw');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

const port = process.env.PORT || 10010;

app.listen(port, () => {
	console.log('Your server is listening on port %d (http://localhost:%d)', port, port);
	console.log('Swagger-ui is available on http://localhost:%d/docs', port);
});

const yamlsListener = express();
yamlsListener.use(cors());
yamlsListener.use('/yamls', express.static(__dirname+'/api/yamls'));
yamlsListener.listen(8081,function(){
	console.log("Yamls listener is up port 8081");
});

const SwaggerUi = require('swagger-tools/middleware/swagger-ui');

const config = {
  appRoot: __dirname
};

SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) { throw err; }

  // Add swagger-ui (This must be before swaggerExpress.register)
  app.use(SwaggerUi(swaggerExpress.runner.swagger));

  // install middleware
  swaggerExpress.register(app);

});
