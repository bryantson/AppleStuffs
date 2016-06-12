var app = angular.module("AllAppleStuffsApp", ["ui.router"]);

app.factory("auth", ["$http", "$window", function($http, $window) {
    var auth = {};

    auth.saveToken = function(token) {
      $window.localStorage["flapper-news-token"] = token;
    };

    auth.getToken = function() {
      return $window.localStorage["flapper-news-token"];
    };

    auth.isLoggedIn = function() {
      var token = auth.getToken();

      if(token) {
        var payload = JSON.parse($window.atob(token.split(".")[1]));

        return payload.exp > Date.now() / 1000;
      } else {
        return false;
      }
    };

    auth.currentUser = function() {
      if(auth.isLoggedIn()) {
        var token = auth.getToken();
        var payload = JSON.parse($window.atob(token.split(".")[1]));

        return payload.username;
      }
    };

    auth.register = function(user) {
      return $http.post("/register", user).success(function(data) {
        auth.saveToken(data.token);
      });
    };

    auth.logIn = function(user) {
      return $http.post("/login", user).success(function(data) {
        auth.saveToken(data.token);
      });
    };

    auth.logOut = function() {
      $window.localStorage.removeItem("flapper-news-token");
    };

    return auth;
}]);

app.factory("ProductStorage", ["$http", function($http) {
    var instance = {
      /*
      products: [
        {id: "1", name: "Magic Keyboard", summary: "Here is Summary", pathImgFull: "magicKeyboard_full_1000x1000.jpeg", pathImgThumb: "magicKeyboard_thumb_300x300.jpeg", price: "99.00", description: "Lorem ipsum dolor sit amet consectetur et sed adipiscing elit. Curabitur et vel sem sit amet dolor neque semper magna. Lorem ipsum dolor sit amet consectetur et dolore adipiscing elit. Curabitur vel sem sit."},
        {id: "2", name: "Macbook Trackpad 2", summary: "Here is Summary", pathImgFull: "magicTrackpad_full_1000x1000.jpeg", pathImgThumb: "magicTrackpad_thumb_300x300.jpeg",  price: "129.00", description: ""},
        {id: "3", name: "Magic Mouse 2", summary: "Here is Summary", pathImgFull: "magicMouse_full_1000x1000.jpeg", pathImgThumb: "magicMouse_thumb_300x300.jpeg", price: "79.00", description: ""},
        {id: "4", name: "LaCie 1TB Portable Hard Drive", summary: "Here is Summary", pathImgFull: "portableHD_full_1000x1000.jpeg", pathImgThumb: "portableHD_thumb_300x300.jpeg", price: "179.95", description: ""},
        {id: "5", name: "Microsoft Office 365 (1-year Subscription; 1 License)", summary: "Here is Summary", pathImgThumb: "office365_thumb_300x300.jpeg", pathImgFull: "office365_full_1000x1000.jpeg", price: "69.95", description: ""},
        {id: "6", name: "Naim Audio mu-so Wireless Speaker System", summary: "Here is Summary", pathImgFull: "naimAudioSystem_full_1000x1000.jpeg", pathImgThumb: "naimAudioSystem_thumb_300x300.jpeg", price: "1499.95", description: ""}
      ]
      */
      products: []

    };

    instance.getAll = function() {
      return $http.get("/products").success(function(data) {
        angular.copy(data, instance.products)
      });
    };

    instance.create = function(product) {
      return $http.post("/products", product).success(function(data) {
        instance.products.push(data);
      });
    };

    return instance;
}]);

app.factory("instagram", ["$http", function($http) {
  return {
    fetchPopular: function(callback) {
      var endPoint = "https://api.instagram.com/v1/users/self/media/recent/?access_token=220836038.c0da5df.bb5f0363e3204e3a985ec13297014dec&callback=JSON_CALLBACK&count=6";
  console.log(endPoint);

      $http.jsonp(endPoint).success(function(response) {
        callback(response.data);
      });
    }
  }
}]);

app.config(["$stateProvider", "$urlRouterProvider", function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state("home",{
      url: "/home",
      templateUrl: "/home.html",
      controller: "HomeCtrl"
  })
  .state("catalogPageMacbook",{
      url: "/catalogPageMacbook",
      templateUrl: "/catalogPageMacbook.html",
      controller: "ProductCatalogController",
      resolve: {
        postPromise: ["ProductStorage", function(ProductStorage) {
          return ProductStorage.getAll();
        }]
      }
  })
  .state("ourStory",{
      url: "/ourStory",
      templateUrl: "/ourStory.html",
      controller: "OurStoryCtrl"
  })
  .state("product", {
    url: "/product/{id}",
    templateUrl: "/product.html",
    controller: "ProductController"
  })
  .state("addProduct" ,{
    url: "/addProduct",
    templateUrl: "/addProduct.html",
    controller: "AddProductCatalogController"
  })
  .state("login", {
    url: "/login",
    templateUrl: "/login.html",
    controller: "AuthCtrl",
    onEnter: ["$state", "auth", function($state, auth) {
      if(auth.isLoggedIn()) {
        $state.go("home");
      }
    }]
  })
  .state("register", {
    url: "/register",
    templateUrl: "/register.html",
    controller: "AuthCtrl",
    onEnter: ["$state", "auth", function($state, auth) {
      if(auth.isLoggedIn()) {
        $state.go("homes");
      }
    }]
  });

  $urlRouterProvider.otherwise("home");
}]);

app.controller("AddProductCatalogController", ["$scope", "$stateParams", "ProductStorage",
    function($scope, $stateParams, ProductStorage) {
      $scope.createProduct = function() {
        if(!$scope.name || $scope.name === '') {
          return;
        }
        ProductStorage.create ({
          name: $scope.name,
          summary: $scope.summary,
          pathImgFull: $scope.pathImgFull,
          pathImgThumb: $scope.pathImgThumb,
          price: $scope.price,
          description: $scope.description
        });
        $scope.name = "";
        $scope.summary = "";
        $scope.pathImgFull = "";
        $scope.pathImgThumb = "";
        $scope.price = "";
        $scope.description = "";
      };
}]);

app.controller("AuthCtrl" , ["$scope", "$state", "auth",
                function($scope, $state, auth) {
  $scope.user = {};

  $scope.register = function() {
    auth.register($scope.user).error(function(error) {
        $scope.error = error;
    }).then(function() {
      $state.go("home");
    });
  };

  $scope.logIn = function() {
    auth.logIn($scope.user).error(function(error) {
      $scope.error = error;
    }).then(function() {
      $state.go("home");
    });
  };
}]);

app.controller("HomeCtrl", ["$scope", "instagram", function($scope, instagram) {
  $scope.test = "Hello World";

  $scope.showHeroBanner = true;

  $scope.pics = [];
  instagram.fetchPopular(function(data) {
    console.log(data);
    $scope.pics = data;
  });
}]);

app.controller("OurStoryCtrl", ["$scope", function($scope) {
  $scope.showHeroBanner = false;
}]);

app.controller("NavCtrl", ["$scope", "auth", function($scope, auth) {
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = auth.logOut;
}]);

app.controller("ProductController", ["$scope", "$stateParams", "ProductStorage",
function($scope, $stateParams, ProductStorage) {
  $scope.idProduct = $stateParams.id;
  $scope.chosenProduct = ProductStorage.products[$scope.idProduct];
}]);

app.controller("ProductCatalogController", ["$scope", "ProductStorage", function($scope, ProductStorage) {
  $scope.summaryProductCatalog = "Shop Macbook Acccessories at All Apple Stuffs";
  $scope.listMacProducts = ProductStorage.products;
}]);
