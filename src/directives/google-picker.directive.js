(function() {
  'use strict';
  angular.module('cmGoogleApi').directive('cmGooglePicker', ['googleClient', '$q', '$window', function(googleClient, $q, $window){
    return {
     restrict: 'A',
     scope: {
      locale: '@',
      views: '&',
      onPicked: '='
    },
    link: function (scope, element, attrs) {

      function pickerCallback (data) {
        if (scope.onPicked && data.action === google.picker.Action.PICKED) {
          scope.$apply(scope.onPicked(data.docs));
        }
      }

      function openPicker(){
        googleClient.afterScriptsLoaded().then(
          function(){
            var picker = new google.picker.PickerBuilder()
            .setLocale(scope.locale)
            .setOAuthToken(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token)
            .setOrigin($window.location.protocol + '//' + $window.location.host)
            .setCallback(pickerCallback);
            var viewArray = scope.views();
            angular.forEach(viewArray, function(view){
              picker.addView(view);
            });
            picker = picker.build();
            picker.setVisible(true);
          }
        );
      }

      element.bind('click', function (e) {
        openPicker();
      });
    }
  };
}]);
})();
