(function() {
  'use strict';
  angular.module('cm-google-api', []);
})();

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
          scriptsLoadingPromise.reject('you need to provide the clientId if you load Picker script');
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
                apiLoadingPromise.reject('at least you nedd to load an Api');
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

(function() {
  'use strict';
  angular.module('cm-google-api').service('googleAuthService', ['$q', 'googleClient', function ($q, googleClient) {
    /*
      GoogleAuth.isSignedIn.get()
      GoogleAuth.currentUser.get()
      GoogleAuth.signIn()
      GoogleAuth.signIn(options)
      GoogleAuth.signOut()
      GoogleAuth.disconnect()
      GoogleAuth.grantOfflineAccess(options)
    */





  }]);
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
          scope.onPicked(data.docs);
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

(function() {
  'use strict';
  angular.module('cm-google-api').directive('cmGoogleSignIn', ['googleClient', function(googleClient){
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      scope: {
        clickHandler: '=',
        signInListener: '=',
        userListener: '='
      },
      template: '<ng-transclude></ng-transclude>',
      link: function (scope, element, attrs) {
        googleClient.afterScriptsLoaded().then(
          function(){
            var auth2 = gapi.auth2.getAuthInstance();
            if (scope.signInListener) {
              auth2.isSignedIn.listen(scope.signInListener);
            }
            if (scope.userListener) {
              auth2.currentUser.listen(scope.userListener);
            }
            auth2.attachClickHandler(element[0], {},
              function(googleUser) {
                if (scope.clickHandler) {
                  scope.clickHandler(googleUser);
                }
              }, function(error) {
                console.log(JSON.stringify(error, undefined, 2));
              }
            );
          },
          function(e){
            console.log(e);
          }
        );
      }
    };
  }]);
})();
