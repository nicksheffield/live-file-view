angular.module('app.services')

.factory('$config', function() {
	var config = {};

	// the port of the socket api
	config.socketPort = 3000;

	// the url to connect to the socket api
	config.socketURL = 'http://' + location.hostname + ':' + config.socketPort;
	
	console.log(config.socketURL)

	return config;
});