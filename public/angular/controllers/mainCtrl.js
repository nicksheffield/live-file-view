angular.module('app.controllers')

.controller('mainCtrl', function($scope, $http, $syntax, $timeout, $loader) {
	$scope.pageTitle = 'Your MEAN website';
	
	$scope.currentFile = {}
	$scope.fileContent = ''
	$scope.syntax = ''
	
	window.scope = $scope

	$scope.$watch('fileContent', function(newVal, oldVal) {
		$timeout(function() {
			Prism.highlightAll()
		}, 0)
	})

	$http.get('/api/files')
		.success(function(data) {
			$scope.files = data
		})
	
	$scope.choose = function(file) {
		$http.post('/api/get_file', {path: file.path})
			.success(function(data) {
				$scope.currentFile = file
				$scope.fileContent = data
				$scope.syntax = $syntax(file.name)
			})
	}
});