# oauth2-chrome-extension-demo
A simple demo of integrating OAuth2 with or without Google in an AngularJS Chrome Extension

## What it does

This is basically a skeleton extension showing how you can integrate OAuth2 into a Google Chrome Extension written in AngularJS.

As an extension, there are some limitations that you just can't seem to get around.  For example, when you have to interact with the OAuth2 system, such as when prompted to enter your login ID and password, the Chrome extension loses focus and will close (unless you have the Chrome Inspect function debugging it).  The background process will capture the completion of the login process, but the token will get saved for the *next* time the user opens the extension up - presumably seconds later.

At that point, the code will check that the access token is still valid, and will try to get a new one if it is not. If you are using Google, as I do for this demo, the user will just automatically login without having to enter credentials on subsequent logins and you will be off to the races.

Once the extension does login or validates that the token it has already is good, it will broadcast a message out to the rest of the AngularJS app telling it that the user is now authenticated.

## Configuring your OAuth2 provider

Normally if you are looking to integrate Google's authentication system into an extension, like I do in this demo, you would use `chrome.identity.getAuthToken()`.  Since I want to be able to integrate with non-Google systems, such as the one at my company, this extension relies upon the `chrome.identity.launchWebAuthFlow()` method and a config file telling it where to find things and how to behave.

Here's the example configuration I use, which you are also free to use during testing if you so wish, though I would recommend that you setup your own OAuth2 configurations at Google:

    {
      "implicitGrantUrl": "https://accounts.google.com/o/oauth2/auth",
      "logoutUrl": "https://accounts.google.com/logout",
      "tokenInfoUrl": "https://www.googleapis.com/oauth2/v3/tokeninfo",
      "userInfoUrl": "https://www.googleapis.com/plus/v1/people/me",
      "userInfoNameField": "displayName",
      "clientId": "814368925475-75jkn9a9t3l2hq25vidrqt9f6ibulku9.apps.googleusercontent.com",
      "scopes": "https://www.googleapis.com/auth/userinfo.profile",
      "logoutWarningSeconds": 60,
      "autoReLogin": true
    }

The `implicitGrantUrl` value is where your OAuth2 system will handle Implicit Grants. You should not use Authorization Code Grants in browser or mobile based applications like Chrome Extensions.

`logoutUrl`, `tokenInfoUrl`, and `userInfoUrl` are the URLs for logging ouu, validating and getting information on OAuth2 tokens, and getting information on the user associated with the token, respectively.  The `userInfoNameField` field is the name of the property in the payload returned by the `userInfoUrl` that has the user's name, just for demonstration purposes.  If `logoutUrl` is missing or blank, the extension will just clear it's internal session without actually invalidating the token it was given.

`clientId` is the identifier assigned by the OAuth2 provider.  This one is used for testing my apps and is assigned to me.  It's fine for dinking around with, but you should get your own because, you know, this one is mine.

`scopes` are the rights you are requesting from the user.  If you need more than one, just comma separate them in this string.

`logoutWarningSeconds` configures how much warning the user should get before their token expires.  Set it to 0 for no warning.  In any event, when the token actually expires due to elapse time since it was issued, the service will send out another event telling the application of that.

Setting `autoReLogin` to true will tell the AngularJS Auth service to automatically try to re-login the user.  This is good if your system doesn't require actual login screen interaction similar to how Google handles things.  If you are using this with Google, for example, the user will probably only ever see the user name and password prompt the very first time they login to the extension.

## Using it

If you want to play around with the extension, you just need to load it as an unpacked extension.  Clone the project to your machine and run `bower install` from the root folder of the project.  That will pull down AngularJS and any other dependencies.

Then pull up the Manage Extensions screen in your Chrome browser, make sure you have 'Developer mode' enabled, and use the 'Load unpacked extension...' button to install it.  Select the root folder of the project, and the extension should show up with the others at the top right of your browser.

## You might have to hack at it

There are a lot of OAuth2'ish systems out there that you could probably make this work with.  I played around with StackExchange's system, for example.  With a little customization you should probably get things to work, as long as they support the same basic concepts.

But as-is, it works with Google's, which is something pretty much everybody has access to.