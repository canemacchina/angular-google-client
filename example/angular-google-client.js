(function() {
  'use strict';
  angular.module('cm-google-api', []);
})();

(function() {
  'use strict';
  angular.module('cm-google-api').provider('googleClient', function () {
    var clientId;
    //FIXME: Set() is not compatible to all browser, so I'll have to wait...
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
      scopes += ' ' + scope
      return this;
    };

    this.setClientId = function(client){
      clientId = client;
      return this;
    };

    this.$get = ['$q', '$window', function ($q, $window) {
      return{
        afterClientLoaded: function(){
          if(!clientLoaded && !clientLoading){
            clientLoading = true;
            clientLoadingPromise = $q.defer();
            var randomId = new Date().getTime();
            var callbackName = '_gapiServiceInitCallback'+randomId;
            $window[callbackName] = function(){
              clientLoaded = true;
              clientLoading = false;
              clientLoadingPromise.resolve();
            };
            var s = document.createElement('script');
            s.src = 'https://apis.google.com/js/client.js?onload='+callbackName;
            document.body.appendChild(s);
          }
          return clientLoadingPromise.promise;
        },
        afterApiLoaded: function(){
          if(!apiLoaded && !apiLoading){
            apiLoadingPromise = $q.defer();
            this.afterClientLoaded().then(function(){
              apiLoading = true;
              angular.forEach(cloudEndpoints, function(endpoint){
                gapi.client.load(endpoint.api, endpoint.version, function(){apiLoadCallback(apiLoadingPromise);}, endpoint.baseUrl);
              });
              angular.forEach(googleApis, function(api){
                gapi.client.load(api.api, api.version, function(){apiLoadCallback(apiLoadingPromise);});
              });
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
