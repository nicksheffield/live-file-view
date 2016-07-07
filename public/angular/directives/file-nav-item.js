angular.module('app.directives')

.directive('fileNavItem', function($recursion) {
	function link(scope, el, attrs){

		el.find('.name').on('click', function() {
			if(scope.data.type == 'directory') {
				scope.opening.toggle(scope.data)
				scope.$apply()
			} else {
				scope.choose(scope.data)
			}
		})
		
		scope.containsChanged = function() {
			if(scope.data.type == 'directory') {
				return searchForChanged(scope.data.files)
			}
			return false
		}
		
		function searchForChanged(files) {
			for(var i=0; i<files.length; i++) {
				var file = files[i]
				if(scope.changing.isChanged(file)) return true
					
				if(file.type == 'directory') {
					var found = searchForChanged(file.files)
					if(found) return true
				}
			}
			return false
		}
	}

	return {
		restrict: 'E',
		replace: false,
		transclude: false,
		templateUrl: 'angular/directives/fileNavItem.html',
		compile: function(el) {
			return $recursion.compile(el, link)
		},
		scope: {
			'data': '=',
			'choose': '=',
			'current': '=',
			'opening': '=',
			'changing': '='
		}
	}
})