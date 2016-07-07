angular.module('app.services')

.factory('$config', function() {
	var config = {};

	// the domain of the rest and socket api's
	config.domain = 'http://localhost';

	// the port of the rest api
	config.restPort = 8000;

	// the port of the socket api
	config.socketPort = 8001;

	// the base url of the restful api
	config.restURL = `${config.domain}:${config.restPort}/api/`;

	// the url to connect to the socket api
	config.socketURL = `${config.domain}:${config.socketPort}`;

	return config;
});