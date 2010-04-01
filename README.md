#uc
is a Firefox extension that allows you to run arbitrary local scripts in chrome windows.
In short, [userChrome.js](http://userchromejs.mozdev.org/) + [subscriptoverlayloader.js](http://stashbox.org/26086/subscriptoverlayloader.js).

###differences from userChrome.js
* Loads only *\*.uc.js* and *\*.uc.xul* (not *userChrome.js*).
* Lets you specify files/directories to load by setting pref **extensions.uc.paths**
  (path/flag pairs in JSON format).
  * Includes a poor GUI for editing it.
  * If directory, loads all uc scripts under it.
  * The default is a single
    _<[UChrm](https://developer.mozilla.org/index.php?title=en/File_I%2F%2FO)>_
    meaning that it loads the *chrome* directory in your current profile
    (as does subscriptoverlayloader.js).
* Targets sidebar windows as well. (e.g. chrome://browser/content/web-panels.xul)

###differences from subscriptoverlayloader.js
* Reads meta data only when necessary--on startup or on script update.
* Supports regex patterns for @include/@exclude by prefixing with '~'.
* Supports [Greasemonkey](http://wiki.greasespot.net/Metadata_Block#.40require)
  style @require pragma that accepts a script URL and loads it beforehand.
  * The URL can be absolute or relative, but must be local.

###bads
* Runs on Firefox 3.5+ only.
* Scamps workaround for <http://bugzil.la/330458>.
