# angular-google-client
`angular-google-client` is an [AngularJS](https://angular.io/) module that helps integrating [Google Client Library for Javascript](https://developers.google.com/api-client-library/javascript) into your angular app.

It can be used to call both Google Api rest service (eg: Drive, Calendar, ...) and [Google Cloud Endpoint](https://cloud.google.com/appengine/docs/java/endpoints/) rest services.

## Requirements
- [AngularJS](http://angularjs.org)

## Getting Started
###Get the library
Install `angular-google-client` package via bower:

```bash
bower install angular-google-client
```

or donwload [latest release](https://github.com/canemacchina/angular-google-client/releases).

###Include `angular-google-client` script

```html
<script type="text/javascript" src="path-to-the-library/angular-google-client.min.js"></script>
```

You don't need to load Google client library script explicitly. `angular-google-client` will do it for you.

###Add dependency

```javascript
var app = angular.module('myModule', ['cm-google-api']);
```

You are done! Enjoy using gapi on Angular JS!

## Configuration
`angular-google-client` is shipped with a provider that you have to configure:

```javascript
app.config(function (googleClientProvider) {
  googleClientProvider
  .addApi('myApi', 'v1', 'https://app-id.appspot.com/_ah/api')
  .addApi('oauth2', 'v2')
  .setClientId('myClientId.apps.googleusercontent.com')
  .addScope('a scope')
  .addScope('another scope')
  .setAutomaticAuth();
});
```

this is the methods explanation:

method | params | description
-----|---------|------------
`addApi` | <ul><li>api</li><li>version</li><li>baseUrl</li></ul> | Add an Api to the list of Api to be loaded. `baseUrl` parameter is optional, and needed only if you want to load a Cloud Endpoint Api.
`setClientId` | <ul><li>clientId</li></ul> | Add the Client Id, needed to make api call.
`addScope` | <ul><li>scope</li></ul>  | Add a scope to the list of scope you need.
`setAutomaticAuth` |  | `googleClient` will try to authenticate user silently. **NB:**  this will work only if the user is already logged in to Google services and if he has already grant permission to your app

## Usage

You can use gapi client library in two ways: using `googleClientService`, a simple wrapper to gapi library, or using gapi directly.

### Make an Api call through googleClientService

```javascript
app.controller('AppCtrl', function ($scope, googleClientService) {
  //a method that not require params:
  $scope.doSomething = function(){
    googleClientService.execute('oauth2.userinfo.get').then(
      function(resp){
        console.log(resp);
      },
      function(reason){
        console.log(reason);
      }
    );
  };
  //a method that require params:
  $scope.doSomethingWithParams = function(objParams){
    googleClientService.execute('oauth2.userinfo.get', objParams).then(
      function(resp){
        console.log(resp);
      },
      function(reason){
        console.log(reason);
      }
    );
  };
});
```

`execute` method take two arguments:
- the method to call, as a String. For example, if you need to call `gapi.client.oauth2.userinfo.get().exectute(...)`, you need to pass `oauth2.userinfo.get` as a first params
- optionally you can specify an object params. For example, if you need to call `gapi.client.drive.files.list({'maxResults': 10})`, you can pass `{'maxResults': 10}` as the second parameter

And yes, `googleClientService` use promises.

### Use gapi library directly
If you feel more comfortable using gapi directly, use it! Only pay attention that Api are loaded:

```javascript
app.controller('AppCtrl', function ($scope, googleClient) {
  googleClient.afterApiLoaded().then(function(){
    gapi.client.testApi.auth().execute(function(resp){
      console.log(resp);
    });
  });
});
```

`afterApiLoaded` checks for you that all apis are loaded before resolve the promise.

#License
MIT. See the LICENSE file for more details.
