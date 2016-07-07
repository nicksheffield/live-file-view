angular.module('app.directives')

.directive('fileNavItem', function($recursion) {
	function link(scope, el, attrs){
		scope.open = false

		console.log('onclick', scope.choose)
		
		var div = el.find('.name')
	
		div.on('click', function() {
			if(scope.data.type == 'directory') {
				scope.open = !scope.open
				scope.$apply()
			} else {
				scope.choose(scope.data)
			}
		})
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
			'choose': '='
		}
	}
})