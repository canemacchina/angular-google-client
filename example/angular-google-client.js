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
    var scriptsToLoad = 0;
    var googleApis = [];
    var cloudEndpoints = [];
    var tryAutomaticAuth = false;
    var loadClient = false;
    var loadPicker = false;

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

    this.loadClientLibrary = function(){
      loadClient = true;
      scriptsToLoad++;
      return this;
    };
    this.loadPickerLibrary = function(){
      loadPicker = true;
      scriptsToLoad++;
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
              if(loadClient){
                gapi.load('client', {'callback': scriptsLoadCallback});
              }
              if(loadPicker){
                gapi.load('picker', {'callback': scriptsLoadCallback});
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
              angular.forEach(cloudEndpoints, function(endpoint){
                gapi.client.load(endpoint.api, endpoint.version, apiLoadCallback, endpoint.baseUrl);
              });
              angular.forEach(googleApis, function(api){
                gapi.client.load(api.api, api.version, apiLoadCallback);
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

(function() {
  'use strict';
	angular.module('cm-google-api').directive('cmGooglePicker', ['googleClient', '$q', function(googleClient, $q){
    var authDeferred = $q.defer();
		return {
			'restrict': 'A',
			link: function (scope, element, attrs) {
        var oauthToken = null;

        function authUser() {
          if(!oauthToken){
            gapi.auth.authorize( { 'client_id': googleClient.clientId, 'scope': 'https://www.googleapis.com/auth/drive', 'immediate': false },  handleAuthResult);
          }
          return authDeferred.promise;
        }

        function handleAuthResult(authResult) {
          if (authResult && !authResult.error) {
            oauthToken = authResult.access_token;
            authDeferred.resolve();
          }
        }

        function pickerCallback (data) {
          console.log(data.action);
          if (data.action == google.picker.Action.LOADED) {
            console.log(data);
          }
          if (data.action == google.picker.Action.CANCEL) {
            console.log(data);
          }
          if (data.action == google.picker.Action.PICKED) {
            console.log(data);
          }
        }

        function openPicker(){
          googleClient.afterScriptsLoaded().then(
            function(){
              authUser().then(function(){
                var picker = new google.picker.PickerBuilder().
                  addView(google.picker.ViewId.DOCS).
                  setOAuthToken(oauthToken).
                  setCallback(pickerCallback).
                  build();
                picker.setVisible(true);
              });
            },
            function(){}
          );
        }

        element.bind('click', function (e) {
          console.log('click')
          openPicker();
        });
    	}
		}
	}]);
})();
