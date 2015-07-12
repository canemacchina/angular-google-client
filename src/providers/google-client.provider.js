(function() {
  'use strict';
  angular.module('cm-google-api').provider('googleClient', function () {
    var apisToLoad;
    var configuration;
    //var CLIENT_ID = "63185388726-6iobqfaremoc92rh9drgketj0a0r0ep1.apps.googleusercontent.com";
    //var SCOPES = "https://www.googleapis.com/auth/userinfo.email";

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
        deferred.resolve();
      }
    };

    this.configure = function (config) {
      apisToLoad = config.length;
      configuration = config;
    };

    this.$get = ['$q', '$window', function ($q, $window) {
      return{
        afterClientLoaded: function(){
          if(!clientLoaded && !clientLoading){
            clientLoading = true;
            clientLoadingPromise = $q.defer();
            console.log('loading client');
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
              console.log('loading api');
              angular.forEach(configuration, function(conf){
                if(conf.cloudEndpoint){
                  gapi.client.load(conf.api, conf.version, function(){apiLoadCallback(apiLoadingPromise);}, conf.baseUrl);
                }else{
                  gapi.client.load(conf.api, conf.version, function(){apiLoadCallback(apiLoadingPromise);});
                }
             });
            });
          }
          return apiLoadingPromise.promise;
        }
      };
    }];
  });
})();
