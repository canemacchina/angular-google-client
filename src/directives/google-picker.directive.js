(function() {
  'use strict';
  angular.module('cm-google-api').directive('cmGooglePicker', ['googleClient', '$q', '$window', function(googleClient, $q, $window){
    var loading;
    var authDeferred;
    var oauthToken = null;
    return {
     restrict: 'A',
     scope: {
      scopes: '=',
      locale: '@',
      views: '&',
      onPicked: '='
    },
    link: function (scope, element, attrs) {
      function authUser() {
        if(!loading && !oauthToken){
          authDeferred = $q.defer();
          gapi.auth.authorize( { 'client_id': googleClient.clientId, 'scope': scope.scopes, 'immediate': false },  handleAuthResult);
        }
        return authDeferred.promise;
      }

      function handleAuthResult(authResult) {
        loading = false;
        if (authResult && !authResult.error) {
          oauthToken = authResult.access_token;
          authDeferred.resolve();
        }else{
          authDeferred.reject();
        }
      }

      function pickerCallback (data) {
        if (scope.onPicked && data.action === google.picker.Action.PICKED) {
          scope.$apply(scope.onPicked(data.docs));
        }
      }

      function openPicker(){
        googleClient.afterScriptsLoaded().then(
          function(){
            authUser().then(function(){
              var picker = new google.picker.PickerBuilder()
              .setLocale(scope.locale)
              .setOAuthToken(oauthToken)
              .setOrigin($window.location.protocol + '//' + $window.location.host)
              .setCallback(pickerCallback);
              var viewArray = scope.views();
              angular.forEach(viewArray, function(view){
                picker.addView(view);
              });
              picker = picker.build();
              picker.setVisible(true);
            });
          }
        );
      }

      loading = true;
      googleClient.afterScriptsLoaded().then(
        function(){
          authDeferred = $q.defer();
          gapi.auth.authorize( { 'client_id': googleClient.clientId, 'scope': scope.scopes, 'immediate': true },  handleAuthResult);
        }
      );

      element.bind('click', function (e) {
        openPicker();
      });
    }
  };
}]);
})();
