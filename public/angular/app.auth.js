angular.module('app.routes')

.run(function($rootScope, $state) {

	$rootScope.$on('$stateChangeStart', function(event, toState, toParams) {
		if (!toState.data) {
			return;
		}

		var requireLogin = toState.data.requireLogin;

		// if the route needs login
		if (requireLogin) {

		}
	});
});