angular.module('app.controllers')

.controller('mainCtrl', function($scope, $http) {
	$scope.pageTitle = 'Your MEAN website';

	$http.get('/api/files').success(function(data) {
		$scope.files = data

		console.log('apiData', $scope.files)
	})
});