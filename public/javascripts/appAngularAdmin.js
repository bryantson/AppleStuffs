var app = angular.module("AllAppleStuffsAdmin", ["ui.router", "ui.bootstrap"]);

app.factory("auth", ["$http", "$window", function($http, $window) {
    var auth = {};

    auth.saveToken = function(token) {
      $window.localStorage["applestuff-classified-token"] = token;
    };

    auth.getToken = function() {
      return $window.localStorage["applestuff-classified-token"];
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
          alert("Hello");
      $window.localStorage.removeItem("applestuff-classified-token");
    };

    return auth;
}]);


app.config(["$stateProvider", "$urlRouterProvider", function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state("home",{
      url: "/home",
      templateUrl: "/login.html",
      controller: "AuthCtrl",
      onEnter: ["$state", "auth", function($state, auth) {
        if(auth.isLoggedIn()) {
          $state.go("dashboard");
        }
      }],
      resolve: {
        postPromise: ["ProductStorage", function(ProductStorage) {
          return ProductStorage.getAll();
        }]
      }
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
  .state("dashboard", {
    url: "/dashboard",
    templateUrl: "/dashboard.html",
    controller: "AdminController",
    resolve: {
      postPromise: ["ProductStorage", function(ProductStorage) {
        return ProductStorage.getAll();
      }]
    }
  })
  .state("dashboard.addProduct" ,{
    url: "/addProduct",
    templateUrl: "/addProduct.html",
    controller: "AddProductCatalogController"
  })
  .state("dashboard.manageContent" ,{
    url: "/manageContent",
    templateUrl: "/manageContent.html",
    controller: "ManageContentCtrl"
  })
  .state("dashboard.monitorAnalytics" ,{
    url: "/monitorAnalytics",
    templateUrl: "/monitorAnalytics.html",
    controller: "MonitorAnalyticsCtrl"
  })
  .state("register", {
    url: "/register",
    templateUrl: "/register.html",
    controller: "AuthCtrl",
    onEnter: ["$state", "auth", function($state, auth) {
      if(auth.isLoggedIn()) {
        $state.go("home");
      }
    }]
  });

  $urlRouterProvider.otherwise("home");
}]);

app.factory("ProductStorage", ["$http", "auth", function($http, auth) {
    var instance = {

      products: []

    };

    instance.getAll = function() {
      return $http.get("/products").success(function(data) {
        angular.copy(data, instance.products)
      });
    };

    instance.create = function(product) {
      return $http.post("/products", product, {
        headers: { Authorization: "Bearer " + auth.getToken()}
      }).success(function(data) {
        instance.products.push(data);
      });
    };

    instance.update = function(product) {
      return $http.put("/products", product, {
        headers: { Authorization: "Bearer " + auth.getToken()}
      }).success(function(data) {
        product.name = data.name;
        product.price = data.price;
      });
    };

    return instance;
}]);

app.controller("AdminController", ["$scope", "$state", "$stateParams", "ProductStorage", "auth",  "$uibModal", "$log",
function($scope, $state, $stateParams, ProductStorage, auth, $uibModal, $log) {
  $scope.isLoggedIn = auth.isLoggedIn;

  $scope.summaryProductCatalog = "Shop Macbook Acccessories at All Apple Stuffs";
  $scope.listMacProducts = ProductStorage.products;

    $scope.animationsEnabled = true;

    $scope.open = function (size, index) {
      var modalInstance = $uibModal.open({
        animation: $scope.animationsEnabled,
        templateUrl: 'myModalContent.html',
        controller: 'ModalInstanceCtrl',
        size: size,
        resolve: {
          product: function () {
            return $scope.listMacProducts[index];
          }
        }
      });

      modalInstance.result.then(function (selectedItem) {
        $scope.selected = selectedItem;
      }, function () {
        $log.info('Modal dismissed at: ' + new Date());
      });
    };

    $scope.toggleAnimation = function () {
      $scope.animationsEnabled = !$scope.animationsEnabled;
    };

  $scope.go = function ( path ) {
    $state.go(path);
  };
}]);



// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, product) {

  $scope.product = product;

  console.log($scope.product);

  $scope.selected = {
    item: product
  };

  $scope.ok = function () {
    $uibModalInstance.close($scope.selected.item);
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
});



app.controller("AddProductCatalogController", ["$scope", "auth", "$stateParams", "ProductStorage",
    function($scope, auth, $stateParams, ProductStorage) {

      $scope.isLoggedIn = auth.isLoggedIn;

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

app.controller("ManageContentCtrl", ["$scope", "auth", "$stateParams",
    function($scope, auth, $stateParams) {

      $scope.isLoggedIn = auth.isLoggedIn;
}]);

app.controller("MonitorAnalyticsCtrl", ["$scope", "auth", "$stateParams",
    function($scope, auth, $stateParams) {

      $scope.isLoggedIn = auth.isLoggedIn;
}]);


app.controller("LoginCtrl", ["$scope", "$state", "$stateParams", "ProductStorage", "auth",
function($scope, $state, $stateParams, ProductStorage, auth) {
  $scope.isLoggedIn = auth.isLoggedIn;
  //alert("Logged In: " + $scope.isLoggedIn);
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

app.controller("NavCtrl", ["$scope", "auth", function($scope, auth) {
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = auth.logOut;
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
      $state.go("dashboard");
    });
  };
}]);
