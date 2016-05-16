(function() {
  'use strict';
  angular.module('cmGoogleApi').provider('googleClient', function () {
    var clientId;
    var scopes = '';
    var googleAuthConfig = {};

    var apisToLoad = 0;
    var scriptsToLoad = 0;
    var googleApis = [];
    var cloudEndpoints = [];
    var loadClient = false;
    var loadPicker = false;
    var loadGoogleSignIn = false;

    var apiLoadingPromise;
    var apiLoaded = false;
    var apiLoading = false;

    var scriptsLoadingPromise;
    var scriptsLoaded = false;
    var scriptsLoading = false;

    var trim = function (str) {
      return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };

    var apiLoadCallback = function() {
      if (--apisToLoad === 0) {
        apiLoaded = true;
        apiLoading = false;
        apiLoadingPromise.resolve();
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
          return;
        }
        if(!googleAuthConfig.fetch_basic_profile && trim(scopes) === ''){
          scriptsLoadingPromise.reject('you need to set "fetch_basic_profile" to true or request at least one scope if you load google auth');
          return;
        }
        aScriptLoaded = true;
        gapi.load('auth', {'callback': scriptsLoadCallback});
        gapi.load('auth2', function(){
          googleAuthConfig.scope = scopes;
          googleAuthConfig.client_id = clientId;
          gapi.auth2.init(googleAuthConfig);
          scriptsLoadCallback();
        });
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
        //I need to load gapi.auth and gapi.auth2 in order to assure that
        //api, endpoints and picker could work
        scriptsToLoad += 2;
        if(typeof config === 'object'){
          if(typeof config.hosted_domain !== 'undefined'){
            googleAuthConfig.hosted_domain = config.hosted_domain;
          }
          if(typeof config.cookie_policy !== 'undefined'){
            googleAuthConfig.cookie_policy = config.cookie_policy;
          }else{
            googleAuthConfig.cookie_policy = 'single_host_origin'
          }
          if(typeof config.fetch_basic_profile !== 'undefined'){
            googleAuthConfig.fetch_basic_profile = config.fetch_basic_profile;
          }else{
            googleAuthConfig.fetch_basic_profile = true;
          }

          if(googleAuthConfig.fetch_basic_profile){
            //try to fix a Google library bug.
            //If no scopes are explicitly requested, no access_token is returned into the AuthResponse object,
            //even if "fetch_basic_profile" is true, that mean "add 'profile and email' scopes"
            //(well, to be precise, access token is returned but deeper into the object, not on the
            //first level like doc says).
            //Simply requesting explicitly a scope fix the bug, so if "fetch_basic_profile" is true
            //I insert "profile" and "email" as requested scopes, that is what Google Library do
            //(doesn't matter if the same scope is requested more than once)
            this.addScope('profile');
            this.addScope('email');
          }
        }
      }
      return this;
    };

    this.loadPickerLibrary = function(){
      if(!loadPicker){
        loadPicker = true;
        scriptsToLoad++;
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
        scopes: scopes.trim()
      };
    }];
  });
})();
