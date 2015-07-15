(function() {
  'use strict';
  var app = angular.module('testApp', ['cm-google-api']);

  app.config(function (googleClientProvider) {
    googleClientProvider
    .addApi('testApi', 'v1', 'http://localhost:8888/_ah/api')
    .addApi('oauth2', 'v2')
    .setClientId('63185388726-3kpt1a96c3tpudc4inio247jq1vj7q19.apps.googleusercontent.com')
    .addScope('https://www.googleapis.com/auth/userinfo.email')
    .setAutomaticAuth();
  });

  app.controller('AppCtrl', function ($scope, googleClient, $q) {
    $scope.email = '';

    googleClient.afterApiLoaded().then(function(){
      gapi.client.oauth2.userinfo.get().execute(function(resp) {
        console.log(resp);
      });
    });

    function isLoggedIn(){
      var deferred = $q.defer();
      googleClient.afterApiLoaded().then(function(){
        gapi.client.oauth2.userinfo.get().execute(function(resp) {
          deferred.resolve(resp);
        });
      });
      return deferred.promise;
    }

    $scope.checkAuth = function(){
      isLoggedIn().then(function(resp){
        console.log(resp);
        $scope.email = resp.email;
      });

    };

    $scope.signIn = function(){
      console.log('autorizzo');
      gapi.auth.authorize({'client_id': googleClient.clientId, 'scope': googleClient.scopes, 'immediate': false}, function(){});
    };

    $scope.vai = function(){
      googleClient.afterApiLoaded().then(function(){
        gapi.client.testApi.auth().execute(function(resp){
          console.log(resp);
        });
      });
    };
  });
})();
