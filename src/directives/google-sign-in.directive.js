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
