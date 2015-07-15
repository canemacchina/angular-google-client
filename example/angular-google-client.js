(function() {
  'use strict';
  angular.module('cm-google-api', []);
})();

(function() {
  'use strict';
  angular.module('cm-google-api').provider('googleClient', function () {
    var clientId;
    var scopes = [];

    var apisToLoad = 0;
    var googleApis = [];
    var cloudEndpoints = [];
    var tryAutomaticAuth = false;

    var apiLoadingPromise;
    var apiLoaded = false;
    var apiLoading = false;

    var clientLoadingPromise;
    var clientLoaded = false;
    var clientLoading = false;

    var apiLoadCallback = function(deferred) {
      if (--apisToLoad === 0) {
        apiLoaded = true;
        apiLoading = false;
        if(tryAutomaticAuth){
          gapi.auth.authorize({'client_id': clientId, 'scope': scopes, 'immediate': true}, function(){deferred.resolve();});
        }else{
          deferred.resolve();
        }
      }
    };

    this.addApi = function(api, version, baseUrl){
      var obj = {};
      obj.api = api;
      obj.version = version;
      apisToLoad++;
      if(typeof baseUrl === 'undefined'){
        googleApis.push(obj);
      }else{
        obj.baseUrl = baseUrl;
        cloudEndpoints.push(obj);
      }
      return this;
    };

    this.setAutomaticAuth = function(){
      tryAutomaticAuth = true;
      this.addScope('https://www.googleapis.com/auth/userinfo.email');
      return this;
    };

    this.addScope = function(scope){
      scopes += ' ' + scope;
      return this;
    };

    this.setClientId = function(client){
      clientId = client;
      return this;
    };

    this.$get = ['$q', '$window', '$document', function ($q, $window, $document) {
      return{
        afterClientLoaded: function(){
          if(!clientLoaded && !clientLoading){
            clientLoading = true;
            clientLoadingPromise = $q.defer();
            $window._cmGoogleClientInitCallback = function(){
              clientLoaded = true;
              clientLoading = false;
              clientLoadingPromise.resolve();
            };
            var script = $document[0].createElement('script');
            script.onerror = function (e) {
              clientLoadingPromise.reject(e);
            };
            script.src = 'https://apis.google.com/js/client.js?onload=_cmGoogleClientInitCallback';
            $document[0].body.appendChild(script);
          }
          return clientLoadingPromise.promise;
        },
        afterApiLoaded: function(){
          if(!apiLoaded && !apiLoading){
            apiLoadingPromise = $q.defer();
            apiLoading = true;
            this.afterClientLoaded().then(function(){
              angular.forEach(cloudEndpoints, function(endpoint){
                gapi.client.load(endpoint.api, endpoint.version, function(){apiLoadCallback(apiLoadingPromise);}, endpoint.baseUrl);
              });
              angular.forEach(googleApis, function(api){
                gapi.client.load(api.api, api.version, function(){apiLoadCallback(apiLoadingPromise);});
              });
            },
            function(e){
              apiLoadingPromise.reject(e);
            });
          }
          return apiLoadingPromise.promise;
        },
        clientId: clientId,
        scopes: scopes
      };
    }];
  });
})();

(function() {
  'use strict';
  angular.module('cm-google-api').service('googleClientService', ['$q', 'googleClient', function ($q, googleClient) {
    this.execute = function(apiMethod, params){
      var deferred = $q.defer();
      googleClient.afterApiLoaded().then(function(){
        apiMethod = apiMethod.split('.');
        var method = gapi.client;
        angular.forEach(apiMethod, function(m){
          method = method[m];
        }, method);
        var request;
        if(typeof params === 'undefined'){
          request = method();
        }else{
          request = method(params);
        }
        request.then(
          function(resp){
            deferred.resolve(resp);
          },
          function(reason){
            deferred.reject(reason);
          });
      },
      function(e){
        deferred.reject(e);
      });
      return deferred.promise;
    };
  }]);
})();
