var app = angular.module('app', ['cmGoogleApi']);

app.config(function (googleClientProvider) {
	// Configure the provider.
	// Google Auth to login the user,
	// drive and youtube scope to make call to those services
	// pickerLibrary to use the picker
	googleClientProvider
		.loadGoogleAuth({
			cookie_policy: 'single_host_origin',
			fetch_basic_profile: true
		})
		.setClientId('63185388726-ts4ircj3ej3afnm97fbqlkg1ihj3l2gv.apps.googleusercontent.com')
		.addScope('https://www.googleapis.com/auth/drive.readonly')
		.addScope(' https://www.googleapis.com/auth/youtube')
		.addApi('drive', 'v2')
		.loadPickerLibrary();
});

app.controller('MainCtrl', function($scope, cmAuthService, cmApiService, googleClient){

	$scope.isSignedIn = false;
	$scope.user = "";
	$scope.viewedFile = [];
	$scope.modifiedFile = [];
	$scope.pickedFile = {};
	$scope.filePicked = false;

	var signInCallback = function(authResult) {
		// Here you can send code to the server,
		// to obtain access_token and refresh_token server side.
		// See https://developers.google.com/identity/sign-in/web/server-side-flow
		// and https://developers.google.com/identity/protocols/OAuth2WebServer
	};

	// Listen for sign-in state changes. See https://developers.google.com/identity/sign-in/web/listeners
	$scope.signInListener = function(val){
		$scope.isSignedIn = val;
	};

	// Listen for changes to current user. See https://developers.google.com/identity/sign-in/web/listeners
	$scope.userListener = function(user){
		$scope.user = user.getBasicProfile().getName();
	};

	// Click Listener. If the user consent the scope, this function is called
	// Is the onSuccess function of GoogleAuth.attachClickHandler.
	// You need this if you want to grant offline access for your app
	// and get the access_token and the refresh_token server side.
	// See https://developers.google.com/identity/sign-in/web/server-side-flow
	// and https://developers.google.com/identity/sign-in/web/reference#googleauthattachclickhandlerwzxhzdk76containerwzxhzdk77_wzxhzdk78optionswzxhzdk79_wzxhzdk80onsuccesswzxhzdk81_wzxhzdk82onfailurewzxhzdk83
	$scope.clickHandler = function() {
		cmAuthService.getAuthInstance().then(function (auth2) {
			auth2.grantOfflineAccess({'redirect_uri': 'postmessage'}).then(signInCallback);
		});
	};

	// Log out the user without revoking all of the scopes that the user granted.
	$scope.logout = function(){
		cmAuthService.getAuthInstance().then(function (auth2) {
			auth2.signOut();
		});
	};

	// Log out the user and revokes all of the scopes that the user granted.
	$scope.disconnect = function(){
		cmAuthService.getAuthInstance().then(function (auth2) {
			auth2.disconnect();
		});
	};

	// Make an api call using cmApiService, my own GAPI wrapper
	$scope.getViewedFile = function(){
		var driveOptions = {
			'maxResults': 10,
			'orderBy': 'lastViewedByMeDate desc',
			'q': 'mimeType != "application/vnd.google-apps.folder"'
		};
		// cmApiService ensure that GAPI is loaded before call the API
		cmApiService.execute('drive.files.list', driveOptions).then(
			function(resp){
				$scope.viewedFile = resp.result.items;
			}
		);
	};

	// Make an api call using GAPI direclty
	$scope.getModifiedFile = function(){
		var driveOptions = {
			'maxResults': 10,
			'orderBy': 'modifiedByMeDate desc',
			'q': 'mimeType != "application/vnd.google-apps.folder"'
		};
		googleClient.afterApiLoaded().then(function(){
			// when the above promise is resolved, I'm sure that GAPI il correctly loaded
			// so here I can use GAPI (essentially is what cmApiService does)
			gapi.client.drive.files.list(driveOptions).execute(function(resp){
				$scope.modifiedFile = resp.items;
				$scope.$apply();
			});
		});
	};

	// Define some views for the picker.
	// See https://developers.google.com/picker/docs/reference
	$scope.views = function(){
		var docsView = new google.picker.DocsView(google.picker.ViewId.DOCS);
		docsView.setParent('ROOT');
		docsView.setSelectFolderEnabled(true);
		docsView.setIncludeFolders(true);
		var videoSearch = new google.picker.VideoSearchView();
		videoSearch.setSite(google.picker.VideoSearchView.YOUTUBE);
		return [docsView, videoSearch];
	};

	// callback that is invoked when the user select data on picker
	$scope.onPicked = function(data){
		$scope.pickedFile = data[0];
		$scope.filePicked = true;
	};

	$scope.test = function(){
		 googleClient.afterApiLoaded().then(function () {
			console.log(gapi.auth.getToken());
			if(gapi.auth.getToken() !== null){
				// if token exists, send access token in request
				//request.setRequestHeader('Authorization','Bearer ' + gapi.auth.getToken().access_token);
				console.log(gapi.auth.getToken().access_token)
				console.log(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token);
			}
		});
	};

});
