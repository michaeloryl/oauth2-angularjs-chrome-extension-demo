myApp.factory('Data', function (localStorageService) {
  var data = {
    store: store,
    fetch: fetch,
    remove: remove,
    clearAll: clearAll
  };

  function store(key, value) {
    return localStorageService.add(key, value);
  }

  function fetch(key) {
    return localStorageService.get(key);
  }

  function remove(key) {
    return localStorageService.remove(key);
  }

  function clearAll() {
    localStorageService.clearAll();
  }

  return data;
});

