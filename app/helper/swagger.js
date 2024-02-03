const express = require('express');

const router = express.Router();

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const path = require('path');

/* This is for Admin end swiagger API doc */
const optionsAdmin = {
	swaggerDefinition: {
		info: {
			title: 'Node',
			version: '1.0.0',
			description: 'Node' + ' API Documentation',
			contact: {
				email: '',
			},
		},
		tags: [
			{
				name: "Auth",
				description: "Authentication APIs"
			},
			{
				name: "User",
				description: "User APIs"
			},
		],
		schemes: ['https', 'http'],
		host: `localhost:3001/`,
		basePath: '/api',
		securityDefinitions: {
			Token: {
				type: 'apiKey',
				description: 'JWT authorization of an API',
				name: 'x-access-token',
				in: 'header',
			},
		},
	},

	apis: [path.join(__dirname, `../routes/api/*.js`)],
};



const swaggerSpec = swaggerJSDoc(optionsAdmin);
require('swagger-model-validator')(swaggerSpec);

router.get('/apidoc-json', (req, res) => {
	res.setHeader('Content-Type', 'application/json');
	res.send(swaggerSpec);
});

router.use('/apidoc', swaggerUi.serveFiles(swaggerSpec), swaggerUi.setup(swaggerSpec));


function validateModel(name, model) {
	const responseValidation = swaggerSpec.validateModel(name, model, false, true);
	if (!responseValidation.valid) {
		throw new Error('Model doesn\'t match Swagger contract');
	}
}





module.exports = {
	router,
	validateModel
};
