angular.module('app.controllers')

.controller('mainCtrl', function($scope, $http) {
	$scope.pageTitle = 'Your MEAN website';
	
	$scope.fileContent = ''

	$http.get('/api/files')
		.success(function(data) {
			$scope.files = data
		})
	
	$scope.choose = function(file) {
		$http.post('/api/get_file', {path: file.path})
			.success(function(data) {
				$scope.fileContent = data
			})
	}
});