(function() {
  'use strict';
	angular.module('cm-google-api').directive('cmGooglePicker', ['googleClient', '$q', function(googleClient, $q){
    var authDeferred = $q.defer();
		return {
			'restrict': 'A',
			link: function (scope, element, attrs) {
        var oauthToken = null;

        function authUser() {
          if(!oauthToken){
            gapi.auth.authorize( { 'client_id': googleClient.clientId, 'scope': 'https://www.googleapis.com/auth/drive', 'immediate': false },  handleAuthResult);
          }
          return authDeferred.promise;
        }

        function handleAuthResult(authResult) {
          if (authResult && !authResult.error) {
            oauthToken = authResult.access_token;
            authDeferred.resolve();
          }
        }

        function pickerCallback (data) {
          console.log(data.action);
          if (data.action == google.picker.Action.LOADED) {
            console.log(data);
          }
          if (data.action == google.picker.Action.CANCEL) {
            console.log(data);
          }
          if (data.action == google.picker.Action.PICKED) {
            console.log(data);
          }
        }

        function openPicker(){
          googleClient.afterScriptsLoaded().then(
            function(){
              authUser().then(function(){
                var picker = new google.picker.PickerBuilder().
                  addView(google.picker.ViewId.DOCS).
                  setOAuthToken(oauthToken).
                  setCallback(pickerCallback).
                  build();
                picker.setVisible(true);
              });
            },
            function(){}
          );
        }

        element.bind('click', function (e) {
          console.log('click')
          openPicker();
        });
    	}
		}
	}]);
})();
