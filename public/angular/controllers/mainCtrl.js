angular.module('app.controllers')

.controller('mainCtrl', function($scope, $http, $syntax, $timeout, $loader, $socket) {
	$scope.pageTitle = 'File Watcher';
	
	$scope.currentFile = {}
	$scope.fileContent = ''
	$scope.syntax = ''
	$scope.files = {}
	$scope.changed = []
	$scope.opened = []
	
	$scope.openingFuncs = {
		isOpen: function(file) {
			return _.indexOf($scope.opened, file.path) != -1
		},
		open: function(file) {
			$scope.opened.push(file.path)
		},
		close: function(file) {
			_.remove($scope.opened, function(path) {
				return file.path == path
			})
		},
		toggle: function(file) {
			if($scope.openingFuncs.isOpen(file)) {
				$scope.openingFuncs.close(file)
			} else {
				$scope.openingFuncs.open(file)
			}
		}
	}
	
	$scope.changingFuncs = {
		isChanged: function(file) {
			return _.indexOf($scope.changed, file.path) != -1
		},
		change: function(file) {
			$scope.changed.push(file.path)
		},
		unchange: function(file) {
			_.remove($scope.changed, function(path) {
				return file.path == path
			})
		}
	}

	$scope.$watch('fileContent', function(newVal, oldVal) {
		$timeout(function() {
			Prism.highlightAll()
		}, 0)
	})

	function load() {
		$http.get('/api/files')
			.success(function(data) {
				$scope.files = data
			})
	}
	
	load()
	
	$scope.choose = function(file) {
		get(file)
		// file.changed = false
		$scope.changingFuncs.unchange(file)
	}
	
	function get(file) {
		$http.post('/api/get_file', {path: file.path})
			.success(function(data) {
				$scope.currentFile = file
				
				if(typeof data == 'string') {
					$scope.fileContent = data
				} else {
					$scope.fileContent = JSON.stringify(data, null, 4)
				}
				
				$scope.syntax = $syntax(file.name)
			})
	}
	
	$socket.on('connected', function() {
		console.log('Connected!', $socket.obj.id)
	})
	
	$socket.on('fschange', function(data) {
		console.log('fschange', data)
		
		if($scope.currentFile.path == data.path) {
			console.log($scope.currentFile.path, data.path, $scope.currentFile.path == data.path)
			get($scope.currentFile)
		} else {
			searchForAndChange(data.path, $scope.files)
		}
	})
	
	$socket.on('fsupdate', function() {
		load()
	})
	
	function searchForAndChange(path, files) {
		_.find(files, function(file) {
			if(file.type == 'directory') {
				searchForAndChange(path, file.files)
			} else {
				if(file.path == path) {
					// file.changed = true
					$scope.changingFuncs.change(file)
				}
			}
		})
	}
});