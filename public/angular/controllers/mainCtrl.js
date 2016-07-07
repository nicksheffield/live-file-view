angular.module('app.controllers')

.controller('mainCtrl', function($scope, $http, $syntax, $timeout) {
	$scope.pageTitle = 'Your MEAN website';
	
	$scope.fileContent = ''
	$scope.syntax = ''

	$scope.$watch('fileContents', function(newVal, oldVal) {
		$timeout(function(){
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
				$scope.fileContent = data
				$scope.syntax = $syntax(file.name) ? $syntax(file.name) : 'none'
			})
	}
});