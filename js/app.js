'use strict';

var STORAGES = {
    galleryList : 'galleryList',
    imageList   : 'imageList'
};

var TEMPLATES   = {};
$('script[type="angular/template"]').each(function(i, element) {
    element = $(element);
    TEMPLATES[element.attr('id')]   = element.text();
});

var storage = angular.module('Storage', ['firebase']);
storage.factory(
    'photosStorage',
    [
        '$firebase',
        function($fireBase) {
            var storage,
                cache   = {},
                link    = new Firebase('https://photo-world.firebaseio.com/');

            try {
                return storage = {
                    getStorage  : function(name, model, secondary) {
                        var _cache;
                        if (!(_cache = cache[name])) {
                            model.push({name:'id',type:'string',auto:true});

                            cache[name] = _cache = {
                                model       : model
                            };

                            if (secondary === true) {
                                _cache.secondary    = true;
                                _cache.storage      = {};
                                return true;
                            } else if (angular.isUndefined(secondary)) {
                                _cache.storage      = $fireBase(link.child(name)).$asArray();
                            }
                        }

                        if (_cache.secondary) {
                            if (!_cache.storage[model]) {
                                _cache.storage[model]  = $fireBase(link.child(name + '_' + model)).$asArray();
                            }

                            return _cache.storage[model];
                        } else {
                            return _cache.storage;
                        }
                    },
                    create      : function(name) {
                        if (!cache[name]) {
                            return false;
                        }

                        var element = {};

                        angular.forEach(cache[name].model, function (variable) {
                            var value;

                            switch (variable.type) {
                                case 'string':
                                    if (variable.auto) {
                                        value   = 'id' + Date.now();
                                    } else {
                                        value   = '';
                                    }
                                    break;
                                case 'boolean':
                                    value   = false;
                                    break;
                                case 'int':
                                    value   = 0;
                                    break;
                                case 'float':
                                    value   = 0.0;
                                    break;
                                case 'array':
                                    value   = [];
                                    break;
                                case 'object':
                                    value   = {};
                                    break;
                                case 'date':
                                    var date = new Date();

                                    value   = [date.getHours(), date.getMinutes()].join(':');
                                    value  += ' ';
                                    value  += [date.getDate(), date.getMonth() + 1, date.getFullYear()].join('/');
                                    break;
                            }

                            element[variable.name]  = value;
                        });

                        return element;
                    },
                    get         : function(name, $scope, src) {
                        if (!cache[name]) {
                            return false;
                        }

                        if (angular.isUndefined(src)) {
                            src = {};
                        }

                        angular.forEach(cache[name].model, function(variable) {
                            switch (variable.type) {
                                case 'date':
                                case 'string':
                                case 'boolean':
                                case 'int':
                                case 'float':
                                    src[variable.name]  = $scope[variable.name];
                                    break;
                                case 'array':
                                    var arr     = src[variable.name];

                                    if (!arr) {
                                        arr         = src[variable.name] = [];
                                    } else {
                                        arr.length  = 0;
                                    }

                                    storage.getStorage(variable.extend).forEach(function(e) {
                                        if ($scope[variable.name].indexOf(e.id) >= 0) {
                                            arr.push(e.id);
                                        }
                                    });
                                    break;
                                case 'object':
                                    var obj     = src[variable.name];

                                    if (!obj) {
                                        obj         = src[variable.name] = {};
                                    }


                                    break;
                            }
                        });

                        return src;
                    },
                    set         : function(name, $scope, src) {
                        if (!cache[name] || !src) {
                            return false;
                        }

                        angular.forEach(cache[name].model, function(variable) {
                            $scope[variable.name]  = src[variable.name];
                        });
                    },
                    save        : function(name, $scope) {
                        if (!cache[name]) {
                            return false;
                        }

                        var element = null;

                        $scope[name].forEach(function (e) {
                            if (e.id === $scope.id) {
                                element = storage.get(name, $scope, e);
                            }
                        });

                        if (!element) {
                            $scope[name].$add(storage.get(name, $scope));
                        } else {
                            $scope[name].$save(element);
                        }
                    },
                    delete      : function(name, $scope, src) {
                        $scope[name].$remove(src);
                    }
                };
            } finally {
                storage.getStorage(STORAGES.galleryList, [
                    {name: 'name', type: 'string'},
                    {name: 'created', type: 'date'},
                    {name: 'thumbnail', type: 'string'},
                    {name: 'images', type: 'array', extend: STORAGES.imageList}
                ]);

                storage.getStorage(STORAGES.imageList, [
                    {name: 'remoteId', type: 'string'},
                    {name: 'width', type: 'int'},
                    {name: 'height', type: 'int'}
                ], true);
            }
        }
    ]
);

var controllers = angular.module('Controllers', ['ngRoute', 'Storage']);

controllers.config(
    [
        '$routeProvider',
        function($routeProvider) {
            $routeProvider
                .when('/gallery', {
                    template    : TEMPLATES.galleryList,
                    controller  : 'GalleryList'
                })
                .when('/gallery/all', {
                    template    : TEMPLATES.imageListAll,
                    controller  : 'GalleryAll'
                })
                .when('/gallery/view/:galleryId', {
                    template    : TEMPLATES.imageList,
                    controller  : 'GalleryView'
                })

                .when('/contacts', {
                    
                })

                .when('/admin', {
                    template    : TEMPLATES.galleryAdmin,
                    controller  : 'GalleryAdmin'
                })
                .when('/admin/images/:galleryId', {
                    template    : TEMPLATES.imagesAdmin,
                    controller  : 'ImagesAdmin'
                })
                .when('/admin/thumbnail/:galleryId', {
                    template    : TEMPLATES.thumbnailAdmin,
                    controller  : 'ThumbnailAdmin'
                })
                .when('/admin/thumbnail/:galleryId/:imageId', {

                })
        }
    ]
);

controllers.controller(
    'GalleryList',
    [
        '$rootScope',
        '$scope',
        'photosStorage',
        function($rootScope, $scope, photosStorage) {
            var galleryList = photosStorage.getStorage(STORAGES.galleryList);

            angular.extend($scope, {
                galleryList : galleryList
            });
        }
    ]
);
controllers.controller(
    'GalleryView',
    [
        '$scope',
        'photosStorage',
        '$routeParams',
        function($scope, photosStorage, $routeParams) {
            var imageList = photosStorage.getStorage(STORAGES.imageList, $routeParams.galleryId);

            $scope.imageList = imageList;

            $scope.$watch('assignments', function() {
                blueimp.Gallery($('#links a'), $('#blueimp-gallery').data());
            });
        }
    ]
);

controllers.controller(
    'GalleryAdmin',
    [
        '$rootScope',
        '$scope',
        'photosStorage',
        function($rootScope, $scope, photosStorage) {
            var galleryList = photosStorage.getStorage(STORAGES.galleryList);
            
            angular.extend($scope, {
                galleryList : galleryList,
                active      : '',
                fnImages    : function(gallery) {
                    return gallery.images || (gallery.images = photosStorage.getStorage(STORAGES.imageList, gallery.id));
                },
                fnCreate    : function() {
                    photosStorage.set(
                        STORAGES.galleryList,
                        $scope,
                        photosStorage.create(STORAGES.galleryList)
                    );

                    $scope.active   = 'create';
                },
                fnEdit      : function(model) {
                    photosStorage.set(
                        STORAGES.galleryList,
                        $scope,
                        model
                    );

                    $scope.active   = 'edit';
                },
                fnSave      : function() {
                    photosStorage.save(
                        STORAGES.galleryList,
                        $scope,
                        $scope.id
                    );

                    $scope.active   = '';
                },
                fnDelete    : function(model) {
                    photosStorage.delete(STORAGES.galleryList, $scope, model);
                },
                fnCancel    : function() {
                    $scope.active   = '';
                }
            })
        }
    ]
);
controllers.controller(
    'ImagesAdmin',
    [
        '$rootScope',
        '$scope',
        'photosStorage',
        '$routeParams',
        function($rootScope, $scope, photosStorage, $routeParams) {
            var imageList = photosStorage.getStorage(STORAGES.imageList, $routeParams.galleryId);

            angular.extend($scope, {
                imageList   : imageList,
                active      : '',
                fnCreate    : function() {
                    photosStorage.set(
                        STORAGES.imageList,
                        $scope,
                        photosStorage.create(STORAGES.imageList)
                    );

                    $scope.active   = 'upload';
                },
                fnSave      : function() {
                    $scope.active   = 'uploading';
                    
                    jQuery.getJSON('http://cors.io/?u=https://api.imageresizer.io/v0.1/images?url=' + $scope.urlImage, function(response) {
                        $scope.remoteId = response.response.id;
                        photosStorage.save(
                            STORAGES.imageList,
                            $scope,
                            $scope.id
                        );

                        $scope.active   = '';

                        $scope.$apply();
                    });
                },
                fnDelete    : function(model) {
                    photosStorage.delete(STORAGES.galleryList, $scope, model);
                },
                fnCancel    : function() {
                    $scope.active   = '';
                }
            })
        }
    ]
);
controllers.controller(
    'ThumbnailAdmin',
    [
        '$rootScope',
        '$scope',
        'photosStorage',
        '$routeParams',
        function($rootScope, $scope, photosStorage, $routeParams) {
            var galleryList = photosStorage.getStorage(STORAGES.galleryList);
            var imageList = photosStorage.getStorage(STORAGES.imageList, $routeParams.galleryId);

            angular.extend($scope, {
                galleryList : galleryList,
                imageList   : imageList,
                setThumbnail: function(model) {
                    var element = null;

                    galleryList.forEach(function (e) {
                        if (e.id === $routeParams.galleryId) {
                            element = e;
                        }
                    });

                    element.thumbnail = model.remoteId;
                    photosStorage.set(STORAGES.galleryList, $scope, element);
                    photosStorage.save(STORAGES.galleryList, $scope, element.id);


                }
            })
        }
    ]
);


var app = angular.module('app', ['ngRoute', 'Controllers']);
app.config(
    [
        '$routeProvider',
        function($routeProvider) {
            $routeProvider
                .otherwise({
                    redirectTo  : '/'
                });
        }
    ]
);

app.controller(
    'Main',
    [
        '$rootScope',
        function($rootScope) {
            $rootScope.showAdmin    = true;
        }
    ]
);
