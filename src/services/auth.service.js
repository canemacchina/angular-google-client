(function() {
  'use strict';
  angular.module('cmGoogleApi').service('cmAuthService', ['$q', 'googleClient', function ($q, googleClient) {
    this.getAuthInstance = function(){
      var deferred = $q.defer();
      googleClient.afterScriptsLoaded().then(
        function(){
          var auth2 = gapi.auth2.getAuthInstance();
          auth2.then(function(){
            /*
            From here the code start to be really weird.
            Since auth2 object have a THEN method Angular try to call auth2.then to resolve the deferred.
            But that THEN method is not the angular deferred THEN method (is the gapi.auth2.GoogleAuth.then method),
            so nothing works.
            To fix this, since I want to return the auth2 objest as is, I have to:

            1) get a reference to the THEN method of Google Object
            2) delete the method on the Google object (setting it at UNDEFINED)
            3) put back that method on the object

            This bug occur with Angular version >=1.3.0
            */
            var thenFn = auth2.then;
            auth2.then = undefined;
            deferred.resolve(auth2);
            auth2.then = thenFn;
          }, function(e){
            deferred.reject(e);
          });
        },
        function(e){
          deferred.reject(e);
        }
        );
return deferred.promise;
};
}]);
})();
