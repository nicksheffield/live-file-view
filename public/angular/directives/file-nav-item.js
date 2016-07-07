angular.module('app.directives')

.directive('fileNavItem', function($compile) {
	function link(scope, el, attrs){
		scope.open = false

		console.log(scope.data.type)

		if(scope.data.type == 'directory') {
			var div = el.find('.file-nav-item')

			console.log(div)

			div.on('click', function() {
				scope.open = !scope.open
				scope.$apply()
			})
		}

		
	}

	return {
		restrict: 'E',
		replace: false,
		transclude: false,
		templateUrl: 'angular/directives/fileNavItem.html',
		link: link,
		compile: function compile(element) {
			var contents = element.contents().remove();
			var contentsLinker;

			return function (scope, iElement) {
				if (angular.isUndefined(contentsLinker)) {
					contentsLinker = $compile(contents);
				}

				contentsLinker(scope, function (clonedElement) {
					iElement.append(clonedElement);
				});
			};
		},
		scope: {
			'data': '='
		}
	}
})