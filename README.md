# angular-google-client
`angular-google-client` is an [AngularJS](https://angular.io/) module that helps integrating [Google Client Library for Javascript](https://developers.google.com/api-client-library/javascript) into your angular app.

It can be used to call both Google Api rest service (eg: Drive, Calendar, ...) and [Google Cloud Endpoint](https://cloud.google.com/appengine/docs/java/endpoints/) rest services.

Also, it include a directive to use [Google Picker](https://developers.google.com/picker).

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Requirements](#requirements)
- [Getting Started](#getting-started)
  - [Get the library](#get-the-library)
  - [Include `angular-google-client` script](#include-angular-google-client-script)
  - [Add dependency](#add-dependency)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Make an Api call through googleClientService](#make-an-api-call-through-googleclientservice)
  - [Use gapi library directly](#use-gapi-library-directly)
  - [Use Google Picker](#use-google-picker)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

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

You don't need to load any Google client library script explicitly. `angular-google-client` will do it for you.

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
    .loadClientLibrary()
    .loadPickerLibrary()
    .addApi('myApi', 'v1', 'https://app-id.appspot.com/_ah/api')
    .addApi('oauth2', 'v2')
    .setClientId('myClientId.apps.googleusercontent.com')
    .addScope('a scope')
    .addScope('another scope')
    .setAutomaticAuth();
  });
```

**Methods explanations:**
method | params | description
-----|---------|------------
loadClientLibrary | | Tells `angular-google-client` to load the Google Client Library for Javascript. You need this if you want to use some Google Api or call a Cloud Endpoint.
loadPickerLibrary | | Tells `angular-google-client` to load the Google Picker script. You need this if you want to use the Google Picker.
addApi | api<br/>version<br/>baseUrl | Add an Api to the list of Api to be loaded. `baseUrl` parameter is optional, and needed only if you want to load a Cloud Endpoint Api.
setClientId | clientId | Add the Client Id, needed to make api call.
addScope | scope | Add a scope to the list of scope you need.
setAutomaticAuth | | `googleClient` will try to authenticate user silently.<br/>**NB:**  this will work only if the user is already logged in to Google services and if he has already grant permission to your app

## Usage
You can use gapi client library in two ways: using `googleClientService`, a simple wrapper to gapi library, or using gapi directly.

**NB**: ensure to call `.loadClientLibrary()` during configuration of `googleClientProvider`.

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

### Use Google Picker
`angular-google-client` is shipped with `cm-google-picker`, a directive to use the Google Picker.

**NB**: ensure to call  `.loadPickerLibrary()` during configuration of `googleClientProvider`.

To use it, configure properly the HTML:

```html
<button cm-google-picker locale='it' scopes='scopes' views='views()' on-picked='onPicked'>picker</button>
```

and setup what you need on your controller:
```javascript
app.controller('AppCtrl', function ($scope, googleClient) {
  $scope.scopes = [
                    'https://www.googleapis.com/auth/drive',
                    'https://www.googleapis.com/auth/youtube'
                  ];
  $scope.views = function(){
      var docsView = new google.picker.DocsView(google.picker.ViewId.DOCS);
      docsView.setParent('ROOT');
      docsView.setSelectFolderEnabled(true);
      docsView.setIncludeFolders(true);
      var videoSearch = new google.picker.VideoSearchView();
      videoSearch.setSite(google.picker.VideoSearchView.YOUTUBE);
      return [docsView, videoSearch];
    };
    $scope.onPicked = function(data){
      console.log(data);
    };
});
```

**Attributes explanations:**
attr | description
-----|------------
locale | UI language of the picker. Refer to [official documentation](https://developers.google.com/picker/docs/#i18n) for a list of locale.
scopes | List of scopes that your picker need.
views | A function that `cm-google-picker` will call to get desired view. See the [official documentation](https://developers.google.com/picker/docs/reference) for a list o possible view. Must return an array of `google.picker.View`.
on-picked | Callback function that is called when the user select something on the picker and confirm the selection. Returns the [Response.DOCUMENTS](https://developers.google.com/picker/docs/reference#Response.DOCUMENTS) object from Google Picker.

## License
MIT. See the LICENSE file for more details.
