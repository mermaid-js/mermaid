# angular-utf8-base64

AngularJS service for UTF-8 and Base64 and Base64url Javascript Encoding

angular-utf8-base64 is based on [Really fast Javascript Base64 encoder/decoder with utf-8 support](http://jsbase64.codeplex.com/releases/view/89265). I just wrapped it as AngularJS service.

There is another AngularJS service for Base64 encoding [available](https://github.com/ninjatronic/angular-base64).
But it doesn't support UTF-8.


## Installation

### Bower

```
bower install angular-utf8-base64
```

```html
<script src="bower_components/angular-utf8-base64/angular-utf8-base64.min.js"></script>
```

## Usage

```javascript
angular
    .module('myApp', ['ab-base64'])
    .controller('myController', [

        '$scope','base64',
        function($scope,base64) {

            $scope.encoded = base64.encode('a string');
            $scope.decoded = base64.decode('YSBzdHJpbmc=');
    }]);
```

### Base64Url Support

Commonly used for supporting JWS and JWT encodings, base64url encoding creates a URL safe output.

```javascript
angular
    .module('myApp', ['ab-base64'])
    .controller('myController', [

        '$scope','base64',
        function($scope,base64) {

            $scope.encoded = base64.urlencode('a string');
            $scope.decoded = base64.urldecode('YSBzdHJpbmc');
    }]);
```
