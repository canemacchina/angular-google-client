# angular-google-client
`angular-google-client` is an [AngularJS](https://angular.io/) module that helps integrating [Google Client Library for Javascript](https://developers.google.com/api-client-library/javascript) into your angular app.

It can be used to call both Google Api rest service (eg: Drive, Calendar, etc) and [Google Cloud Endpoint](https://cloud.google.com/appengine/docs/java/endpoints/) rest services, and it include a directive to use [Google Picker](https://developers.google.com/picker).
Google authentication and authorization are provided using [Google Sign-in](https://developers.google.com/identity/sign-in/web/).
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Requirements](#requirements)
- [Getting Started](#getting-started)
  - [Get the library](#get-the-library)
  - [Include `angular-google-client` script](#include-angular-google-client-script)
  - [Add dependency](#add-dependency)
- [Configuration](#configuration)
  - [Methods explanations](#methods-explanations)
- [Usage](#usage)
  - [User authentication & authorization](#user-authentication-&-authorization)
  - [Make api calls](#make-api-calls)
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
var app = angular.module('myModule', ['cmGoogleApi']);
```

You are done! Enjoy using gapi on Angular JS!

## Configuration
`angular-google-client` is shipped with a provider that you have to configure:

```javascript
app.config(function (googleClientProvider) {
  googleClientProvider
    .loadPickerLibrary()
    .loadGoogleAuth({
      cookie_policy: 'single_host_origin',
      hosted_domain: 'your-domain.com',
      fetch_basic_profile: true
    })
    .setClientId('myClientId.apps.googleusercontent.com')
    .addScope('a scope')
    .addScope('another scope')
    .addApi('myApi', 'v1', 'https://app-id.appspot.com/_ah/api')
    .addApi('oauth2', 'v2');
  });
```

###Methods explanations###

**loadPickerLibrary()**
<br/>
Optional. Tells `angular-google-client` to load the Google Picker script. You need this if you want to use the Google Picker.

**loadGoogleAuth(config: object)**
<br/>
Tells `angular-google-client` to load the Google auth script. You need this if you want to make authorized api call, or use the Google Picker.
`config` is an object that support three properties:

- cookie_policy
- hosted_domain
- fetch_basic_profile

These properties are the same explained into the official [Google Signin Documentation](https://developers.google.com/identity/sign-in/web/reference#gapiauth2initwzxhzdk20paramswzxhzdk21).

**NB**: original `gapi.auth2.init` accept an object with more properties, but for the scope of this library:

- <i>client_id</i>: is used the Client ID specified during the provider configuration
- <i>scope</i>: are used the scopes specified during the provider configuration
- <i>openid_realm</i>: is not used

**setClientId(clientId: string)**
<br/>
Add the Client Id, needed to make authorized api call, or to use Google Picker

**addScope(scope: string)**
<br/>
Add a scope to the list of scope you need. Note that to correctly authenticate and authorize api, if you set `fetch_basic_profile` to false (on loadGoogleAuth method), you need to add at least `https://www.googleapis.com/auth/userinfo.email` scope.

**addApi(api: string, version: string, baseUrl: string)**
<br/>
Optional. Add an Api to the list of Api to be loaded. `baseUrl` parameter is optional, and needed only if you want to load a Cloud Endpoint Api. When you call `addApi`, the provider automatically load Google Client library.

## Usage

### User authentication & authorization
In order to authenticate the user and ask for grant, use `cm-google-sign-in` directive.

**NB**: ensure to call `.loadGoogleAuth()` during configuration of `googleClientProvider`.

```html
<cm-google-sign-in click-handler='clickHandler' sign-in-listener='signInListener' user-listener='userListener'>
  <!--
    your html button
  -->
</cm-google-sign-in>
```

To create the sign in button, see the [Official Doc](https://developers.google.com/identity/sign-in/web/build-button).

**NB**: this library support only the custom button, it **doesn't** support the default button. So you have to take look at the section <i>Building a button with a custom graphic</i> and see the html and css example. Obviously, you don't need to add the extra javascript or initialize Google library as explained into the Google documentation.

The directive support also three function callback:

- **click-handler(googleUser: GoogleUser)**, that in invoked after the user click the button. `googleUser` is the user currently logged in.
- **sign-in-listener(val: boolean)**, that is invoked when sign-in state change. See [https://developers.google.com/identity/sign-in/web/listeners](https://developers.google.com/identity/sign-in/web/listeners)
- **user-listener(googleUser: GoogleUser)**, that in invoked when the user changes. `googleUser` is the updated user. See [https://develop.ers.google.com/identity/sign-in/web/listeners](https://developers.google.com/identity/sign-in/web/listeners)

### Make api calls

You can use gapi client library in two ways: using `cmApiService`, a simple wrapper to gapi library, or using gapi directly.

**Make an Api call through cmApiService**

```javascript
app.controller('AppCtrl', function ($scope, cmApiService) {
  //a method that not require params:
  $scope.doSomething = function(){
    cmApiService.execute('oauth2.userinfo.get').then(
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
    cmApiService.execute('drive.files.list', objParams).then(
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

**Use gapi library directly**

If you feel more comfortable using gapi directly, use it! Only pay attention that Api are loaded:

```javascript
app.controller('AppCtrl', function ($scope, googleClient) {
  googleClient.afterApiLoaded().then(function(){
    gapi.client.drive.files.list({'maxResults': 10}).execute(function(resp){
      console.log(resp);
      $scope.$apply();
    });
  });
});
```

`afterApiLoaded` checks for you that all apis are loaded before resolve the promise.

**NB** If you use gapi directly you need to call `$scope.$apply()` (or `$scope.$apply(function)`), because the callback function is called outside Angular scope.

### Use Google Picker
`angular-google-client` is shipped with `cm-google-picker`, a directive to use the Google Picker.

**NB**: ensure to call  `.loadPickerLibrary()` during configuration of `googleClientProvider`.

To use it, configure properly the HTML:

```html
<button cm-google-picker locale='it' views='views()' on-picked='onPicked'>picker</button>
```

and setup what you need on your controller:

```javascript
app.controller('AppCtrl', function ($scope) {
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
views | A function that `cm-google-picker` will call to get desired view. See the [official documentation](https://developers.google.com/picker/docs/reference) for a list of possible view. Must return an array of `google.picker.View`.
on-picked | Callback function that is called when the user select something on the picker and confirm the selection. Returns the [Response.DOCUMENTS](https://developers.google.com/picker/docs/reference#Response.DOCUMENTS) object from Google Picker.

## License
MIT. See the LICENSE file for more details.
