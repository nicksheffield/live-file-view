angular.module('app.directives')

.directive('rand', function($recursion) {
	function link(scope, el, attrs) {
		
		var rand = parseInt(Math.random() * el.children().length)
		
		el.children().each(function(i, child) {
			if(rand !== i) {
				$(child).css('display', 'none')
			}
		})
		
		
	}

	return {
		restrict: 'E',
		replace: false,
		transclude: false,
		link: link
	}
})