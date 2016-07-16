myApp.factory('Auth', function ($window, $timeout, $http, $log, Chrome, Broadcast, Data) {
  var auth = { // this is the service object we'll return
    doLogin: doLogin,
    doLogout: doLogout,
    validateToken: validateToken,
    getUserInfo: getUserInfo,
    getUserName: getUserName,
    isAuthenticated: isAuthenticated
  };

  var bgp = Chrome.extension.getBackgroundPage(); // this is how we access the extension's background.js page

  var config = {};
  var authenticated = false;
  var expires = 0;
  var expiresTimerId = null;
  var warning = 0;
  var warningTimerId = null;
  var userInfo = {};
  var token = null;

  $log.debug('Auth service instantiated');

  $http.get('../../config.json') // fetches the config when the service is instantiated
      .then(
          function (jsonConfig) {
            config = jsonConfig.data;
            bgp.init(config, $log);
            $log.debug('OAuth2 configuration loaded:', JSON.stringify(config));
            doRestore();
          },
          function error(err) {
            $log.error('OAuth2 configuration failed:', JSON.stringify(err));
            config = null;
          });


  function doRestore() {
    var restoredToken = bgp.getLastToken(); // Data.fetch('token');

    if (restoredToken != null) {
      validateToken(restoredToken, function (results, err) {
        if (err) {
          authenticated = false;
          Broadcast.send("login", getAuthStatus(false, {error: 'Token failed validation'}));
          $log.error('OAuth2: Token failed validation:', err);
        } else {
          var expiresSeconds = results.data.expires_in;
          token = restoredToken;
          $log.debug("Restore expiresIn:", expiresSeconds);
          startTimers(expiresSeconds); //
          expires = new Date();
          expires = expires.setSeconds(expires.getSeconds() + expiresSeconds);
          authenticated = true;
          fetchUserInfo();
          Broadcast.send("login", getAuthStatus(true, null));
          $log.info('OAuth2 restoration: Success');
        }
      });
    } else {
      $log.debug('No token to restore');
    }
  }

  function doLogin() {
    bgp.login(config,
        function (redirectUrl) {
          $log.debug('RedirectURL received:', redirectUrl);
          if (redirectUrl) {
            var parsed = bgp.parse(redirectUrl.substr(Chrome.identity.getRedirectURL("oauth2").length + 1));
            var expiresSeconds = Number(parsed.expires_in) || 1800;
            $log.debug('Parsed RedirectURL:', JSON.stringify(parsed));
            token = parsed.access_token;
            if (token) {
              validateToken(token, function (results, err) {
                if (err) {
                  authenticated = false;
                  Broadcast.send("login", getAuthStatus(false, {error: 'Token failed validation'}));
                  $log.error('OAuth2: Token failed validation');
                } else {
                  startTimers(expiresSeconds); //
                  expires = new Date();
                  expires = expires.setSeconds(expires.getSeconds() + expiresSeconds);
                  Data.store('token', token);
                  authenticated = true;
                  fetchUserInfo();
                  Broadcast.send("login", getAuthStatus(true, null));
                  $log.info('OAuth2: Success');
                }
              });
            } else {
              authenticated = false;
              Broadcast.send("login", getAuthStatus(false, {error: 'No token found on URL'}));
              $log.error('OAuth2: No token found');
            }
          } else {
            authenticated = false;
            Broadcast.send("login", getAuthStatus(false, {error: 'General error'}));
            $log.error('OAuth2: General error');
          }
        }
    )
  }

  function doLogout() {
    authenticated = false;
    expiresTimerId = null;
    expires = 0;
    token = null;
    Data.remove('token', token);
    Broadcast.send("login", getAuthStatus(true, null));
    $log.debug('Session has been cleared');

    if (config.logoutUrl != null) {
      bgp.logout(config,
          function (redirectUrl) {
            $log.info("Logged out with webflow");
          }
      )
    }
  }

  function getUserInfo() {
    return userInfo;
  }

  function getUserName() {
    if (userInfo) {
      return userInfo[config.userInfoNameField];
    }
    return null;
  }

  function isAuthenticated() {
    return authenticated;
  }

  function validateToken(token, callback) {
    var url = config.tokenInfoUrl + "?access_token=" + token;
    $http.get(url) // fetches the config when the service is instantiated
        .then(
            function (results) {
              $log.debug('Validation Results:', JSON.stringify(results.data));
              callback(results, null);
            },
            function error(err) {
              $log.error('Validation Error:', JSON.stringify(err));
              callback(null, err);
            });

  }

  function fetchUserInfoCb(successCallback, errorCallback) {
    if (token != null) {
      var headers = {};
      headers['Authorization'] = 'Bearer ' + token;

      var httpConfig = {method: 'GET', url: config.userInfoUrl, headers: headers};

      //noinspection TypeScriptUnresolvedFunction
      $http(httpConfig).then(successCallback, errorCallback);
    } else {
      $log.debug('fetchUserInfoCb token was null')
    }
  }

  function fetchUserInfo() {
    fetchUserInfoCb(
        function successCallback(info) {
          userInfo = info.data;
          $log.debug("Fetched user info:", JSON.stringify(info.data));
          Broadcast.send('userInfo', {success: true});
        },
        function errorCallback(err) {
          $log.error("Failed to fetch user info:", err);
          Broadcast.send('userInfo', {success: false});
        }
    );
  }

  function startTimers(seconds) {
    if (expiresTimerId != null) {
      clearTimeout(expiresTimerId);
    }
    if (warningTimerId != null) {
      clearTimeout(warningTimerId);
    }
    expiresTimerId = setTimeout(function () {
      $log.debug('Session has expired');
      doLogout();
    }, seconds * 1000); // seconds * 1000
    $log.debug('Token expiration timer set for', seconds, "seconds");

    if (config.logoutWarningSeconds > 0 && seconds > config.logoutWarningSeconds) {
      warningTimerId = setTimeout(function () {
        if (config.autoReLogin) { // auto re-login can cause the user to be prompted, depending on the OAuth2 system
          $log.info("Automatic re-login initiating");
          doLogin();
        } else {
          $log.debug('Sending session expiration warning');
          Broadcast.send('warning', {remaining: config.logoutWarningSeconds});
        }
      }, (seconds - config.logoutWarningSeconds) * 1000); // seconds * 1000

      $log.debug('Token expiration', (config.autoReLogin ? 're-login' : 'warning'), 'timer set for', seconds - config.logoutWarningSeconds, "seconds");
    }
  }

  function getAuthStatus(success, error) {
    return {
      success: success,
      authenticated: authenticated,
      token: token,
      expires: expires,
      error: error
    }
  }

  return auth;
});

