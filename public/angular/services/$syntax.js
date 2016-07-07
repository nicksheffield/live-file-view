angular.module('app.services')

.factory('$syntax', function() {
	var types = {
		'css':  'css',
		'html': 'markup',
		'js':   'javascript',
		'php':  'php',
		'sql':  'sql',
		'md':   'markdown',
		'sh':   'bash',
		'styl': 'stylus',
		'scss': 'sass',
		'sass': 'sass',
		'less': 'less',
		'json': 'javascript'
	}

	var service = function(filename) {
		var bits = filename.split('.')

		var lastBit = bits[bits.length-1]
		
		var lang = 'language-none'
		
		if(types[lastBit]) {
			lang = 'language-' + types[lastBit]
		}

		return lang;
	}

	return service
})