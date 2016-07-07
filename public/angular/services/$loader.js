angular.module('app.services')

.factory('$loader', function($http) {
	var service = {
		files: [],
		getFile: function(file) {
			var promise = $http
				.post('/api/file/', {path: file.path})
				.then(function(data) {
					files.push(data)
					return data
				})
			
			return promise
		}
	}

	return service
})