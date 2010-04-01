#uc
is a Firefox extension that allows you to run arbitrary local scripts in chrome windows.
In short, [userChrome.js](http://userchromejs.mozdev.org/) + [subscriptoverlayloader.js](http://stashbox.org/26086/subscriptoverlayloader.js).

###differences from userChrome.js
* Loads only *\*.uc.js* and *\*.uc.xul* (not *userChrome.js*).
* Lets you specify files/directories to load by setting pref **extensions.uc.paths**
  (path/flag pairs in JSON format).
  * includes a poor GUI for editing it.
  * If directory, loads all uc scripts under it.
  * The default is a single *<[UChrm](https://developer.mozilla.org/index.php?title=en/File_I%2F%2FO)>* meaning that it loads
    the *chrome* directory in your current profile.
* Targets sidebar windows as well. (e.g. chrome://browser/content/web-panels.xul)

###differences from subscriptoverlayloader.js
* Reads meta data only when necessary--on startup or on script update.
* Supports regex patterns for @include/@exclude by prefixing with '~'.
