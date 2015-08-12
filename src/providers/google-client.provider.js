(function() {
  'use strict';
  angular.module('cm-google-api').provider('googleClient', function () {
    var clientId;
    var scopes = [];
    var googleAuthConfig = {};

    var apisToLoad = 0;
    var scriptsToLoad = 0;
    var googleApis = [];
    var cloudEndpoints = [];
    var tryAutomaticAuth = false;
    var loadClient = false;
    var loadPicker = false;
    var loadGoogleSignIn = false;

    var apiLoadingPromise;
    var apiLoaded = false;
    var apiLoading = false;

    var scriptsLoadingPromise;
    var scriptsLoaded = false;
    var scriptsLoading = false;

    var apiLoadCallback = function() {
      if (--apisToLoad === 0) {
        apiLoaded = true;
        apiLoading = false;
        if(tryAutomaticAuth){
          gapi.auth.authorize({'client_id': clientId, 'scope': scopes, 'immediate': true}, function(){apiLoadingPromise.resolve();});
        }else{
          apiLoadingPromise.resolve();
        }
      }
    };

    var scriptsLoadCallback = function() {
      if (--scriptsToLoad === 0) {
        scriptsLoaded = true;
        scriptsLoading = false;
        scriptsLoadingPromise.resolve();
      }
    };

    var loadScripts = function(){
      var aScriptLoaded = false;
      if(loadGoogleSignIn){
        if(typeof clientId === 'undefined'){
          scriptsLoadingPromise.reject('you need to provide the clientId if you load google auth');
        }else{
          aScriptLoaded = true;
          gapi.load('auth2', function(){
            googleAuthConfig.scope = scopes;
            googleAuthConfig.client_id = clientId;
            gapi.auth2.init(googleAuthConfig);
            scriptsLoadCallback();
          });
        }
      }
      if(loadClient){
        aScriptLoaded = true;
        gapi.load('client', {'callback': scriptsLoadCallback});
      }
      if(loadPicker){
        if(typeof clientId === 'undefined'){
          scriptsLoadingPromise.reject('you need to provide the clientId if you load google picker');
        }else{
          aScriptLoaded = true;
          gapi.load('picker', {'callback': scriptsLoadCallback});
          gapi.load('auth', {'callback': scriptsLoadCallback});
        }
      }
      return aScriptLoaded;
    };

    var loadApi = function(){
      var anApiLoaded = false;
      angular.forEach(cloudEndpoints, function(endpoint){
        anApiLoaded = true;
        gapi.client.load(endpoint.api, endpoint.version, apiLoadCallback, endpoint.baseUrl);
      });
      angular.forEach(googleApis, function(api){
        anApiLoaded = true;
        gapi.client.load(api.api, api.version, apiLoadCallback);
      });
      return !loadClient || anApiLoaded;
    };

    var loadClientLibrary = function(){
      if(!loadClient){
        loadClient = true;
        scriptsToLoad++;
      }
      return this;
    };

    this.loadGoogleAuth = function(config){
      if(!loadGoogleSignIn){
        loadGoogleSignIn = true;
        scriptsToLoad++;
        if(typeof config.cookie_policy !== 'undefined'){
          googleAuthConfig.cookie_policy = config.cookie_policy;
        }
        if(typeof config.hosted_domain !== 'undefined'){
          googleAuthConfig.hosted_domain = config.hosted_domain;
        }
        this.addScope('profile');
        this.addScope('email');
      }
      return this;
    };

    this.loadPickerLibrary = function(){
      if(!loadPicker){
        loadPicker = true;
        //just a bit weird. If I load picker library, I need to call
        //gapi.load('auth', {'callback': scriptsLoadCallback});
        //but if I load client library, auth is automatically loaded.
        //Instead of handle both cases, I prefer to load two time auth
        scriptsToLoad +=2;
      }
      return this;
    };

    this.addApi = function(api, version, baseUrl){
      loadClientLibrary();
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
        afterScriptsLoaded: function(){
          if(!scriptsLoaded && !scriptsLoading){
            scriptsLoading = true;
            scriptsLoadingPromise = $q.defer();
            $window._cmGoogleClientInitCallback = function(){
              if(!loadScripts()){
                scriptsLoadingPromise.reject('at least you need to add some api, load picker library or load google auth');
              }
            };
            var script = $document[0].createElement('script');
            script.onerror = function (e) {
              scriptsLoadingPromise.reject(e);
            };
            script.src = 'https://apis.google.com/js/api.js?onload=_cmGoogleClientInitCallback';
            $document[0].body.appendChild(script);
          }
          return scriptsLoadingPromise.promise;
        },
        afterApiLoaded: function(){
          if(!apiLoaded && !apiLoading){
            apiLoadingPromise = $q.defer();
            apiLoading = true;
            this.afterScriptsLoaded().then(function(){
              if(!loadApi()){
                apiLoadingPromise.reject('at least you need to load an Api');
              }
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
