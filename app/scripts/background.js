// If you make changes here, you have to reload the extension (in settings) for them to take effect

// Any function in this file can be referenced elsewhere by using chrome.extension.getBackgroundPage().myFunction()
// For example, you can reference the login function as chrome.extension.getBackgroundPage().login()

var config = {};
var token = null;
var logger = console;

function init(cfg, log) {
  config = cfg;
  logger = log;
}

function getLastToken() {
  return token;
}

function login(config, callback) {
  var authUrl = config.implicitGrantUrl
      + '?response_type=token&client_id=' + config.clientId
      + '&scope=' + config.scopes
      + '&redirect_uri=' + chrome.identity.getRedirectURL("oauth2");

  logger.debug('launchWebAuthFlow:', authUrl);

  chrome.identity.launchWebAuthFlow({'url': authUrl, 'interactive': true}, function (redirectUrl) {
    if (redirectUrl) {
      logger.debug('launchWebAuthFlow login successful: ', redirectUrl);
      var parsed = parse(redirectUrl.substr(chrome.identity.getRedirectURL("oauth2").length + 1));
      token = parsed.access_token;
      logger.debug('Background login complete');
      return callback(redirectUrl); // call the original callback now that we've intercepted what we needed
    } else {
      logger.debug("launchWebAuthFlow login failed. Is your redirect URL (" + chrome.identity.getRedirectURL("oauth2") + ") configured with your OAuth2 provider?");
      return (null);
    }
  });
}

function logout(config, callback) {
  var logoutUrl = config.logoutUrl;

  chrome.identity.launchWebAuthFlow({'url': logoutUrl, 'interactive': false}, function (redirectUrl) {
    logger.debug('launchWebAuthFlow logout complete');
    return callback(redirectUrl)
  });
}

function parse(str) {
  if (typeof str !== 'string') {
    return {};
  }
  str = str.trim().replace(/^(\?|#|&)/, '');
  if (!str) {
    return {};
  }
  return str.split('&').reduce(function (ret, param) {
    var parts = param.replace(/\+/g, ' ').split('=');
    // Firefox (pre 40) decodes `%3D` to `=`
    // https://github.com/sindresorhus/query-string/pull/37
    var key = parts.shift();
    var val = parts.length > 0 ? parts.join('=') : undefined;
    key = decodeURIComponent(key);
    // missing `=` should be `null`:
    // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
    val = val === undefined ? null : decodeURIComponent(val);
    if (!ret.hasOwnProperty(key)) {
      ret[key] = val;
    }
    else if (Array.isArray(ret[key])) {
      ret[key].push(val);
    }
    else {
      ret[key] = [ret[key], val];
    }
    return ret;
  }, {});
}
