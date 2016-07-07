angular.module('app.controllers')

.controller('mainCtrl', function($scope, $http, $syntax, $timeout, $loader, $socket) {
	$scope.pageTitle = 'Your MEAN website';
	
	$scope.currentFile = {}
	$scope.fileContent = ''
	$scope.syntax = ''

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
		get(file)
	}
	
	function get(file) {
		$http.post('/api/get_file', {path: file.path})
			.success(function(data) {
				$scope.currentFile = file
				$scope.fileContent = data
				$scope.syntax = $syntax(file.name)
			})
	}
	
	$socket.on('connected', function() {
		console.log('Connected!', $socket.obj.id)
	})
	
	$socket.on('fschange', function(data) {
		console.log('fschange', data)
		
		if($scope.currentFile.path == data.path) {
			console.log('match')
			get($scope.currentFile)
		} else {
			console.log('no match')
		}
	})
});