(function() {
  'use strict';
  angular.module('cm-google-api').provider('googleClient', function () {
    var apisToLoad = 0;
    var googleApis = [];
    var cloudEndpoints = [];

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

    this.addApi = function(api, version, baseUrl){
      console.log(api);
      console.log(version);
      console.log(baseUrl);
      var obj = {};
      obj.api = api;
      obj.version = version;
      apisToLoad++;
      if(baseUrl === 'undefined'){
        googleApis.push(obj);
      }else{
        obj.baseUrl = baseUrl;
        cloudEndpoints.push(obj);
      }
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
              angular.forEach(cloudEndpoints, function(endpoint){
                gapi.client.load(endpoint.api, endpoint.version, function(){apiLoadCallback(apiLoadingPromise);}, endpoint.baseUrl);
              });
              angular.forEach(googleApis, function(api){
                gapi.client.load(api.api, api.version, function(){apiLoadCallback(apiLoadingPromise);});
              });
            });
          }
          return apiLoadingPromise.promise;
        }
      };
    }];
  });
})();
