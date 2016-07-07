angular.module('app.services')

.factory('$syntax', function() {
	var types = {
		'css': 'css',
		'html': 'markup',
		'js': 'javascript',
		'php': 'php',
		'sql': 'sql'
	}

	var service = function(filename) {
		var bits = filename.split('.')

		var lastBit = bits[bits.length-1]

		return types[lastBit]
	}

	return service
})