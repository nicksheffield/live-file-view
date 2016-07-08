angular.module('app.directives',)

.directive('resizer', function($document) {

	// http://stackoverflow.com/questions/18368485/angular-js-resizable-div-directive

	return function($scope, $element, $attrs) {

		console.log($scope, $element)

		var localX = localStorage.getItem('sidebar-resizer-x')

		if(localX) {
			setX(localX)
		}

		function setX(x) {
			localStorage.setItem('sidebar-resizer-x', x)
			
			$element.css({
				left: x + 'px'
			})

			$($attrs.resizerLeft).css({
				width: x + 'px'
			})

			$($attrs.resizerRight).css({
				left: (x + parseInt($attrs.resizerWidth)) + 'px'
			})
		}

		$element.on('mousedown', function(event) {
			event.preventDefault()

			$document.on('mousemove', mousemove)
			$document.on('mouseup', mouseup)
		})

		function mousemove(event) {

			if ($attrs.resizer == 'vertical') {
				// Handle vertical resizer
				var x = event.pageX

				if ($attrs.resizerMax && x > $attrs.resizerMax) {
					x = parseInt($attrs.resizerMax)
				}

				if($attrs.resizerMin && x < $attrs.resizerMin) {
					x = parseInt($attrs.resizerMin)
				}

				setX(x)

			} else {
				// Handle horizontal resizer
				var y = window.innerHeight - event.pageY

				$element.css({
					bottom: y + 'px'
				})

				$($attrs.resizerTop).css({
					bottom: (y + parseInt($attrs.resizerHeight)) + 'px'
				})
				$($attrs.resizerBottom).css({
					height: y + 'px'
				})
			}
		}

		function mouseup() {
			$document.unbind('mousemove', mousemove)
			$document.unbind('mouseup', mouseup)
		}
	}
})