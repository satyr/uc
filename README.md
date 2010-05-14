#uc
is a Firefox extension that allows you to run arbitrary local scripts in chrome windows.
In short, [userChromeJS](http://userchromejs.mozdev.org/) + [subscriptoverlayloader.js](http://stashbox.org/26086/subscriptoverlayloader.js).

###improvements from userChromeJS + subscriptoverlayloader.js
* Lets you specify files/directories to load by setting pref
  __extensions.uc.paths__ (path/depth pairs in JSON format).
  * Includes a poor GUI for editing it.
  * If directory, loads all uc scripts below it up to the specified depth.
  * If depth = 0, never loads it.
  * The default setting has a single
    _<[UChrm](https://developer.mozilla.org/index.php?title=en/File_I%2F%2FO)>_
    meaning that it loads the *chrome* directory in your current profile
    (as does subscriptoverlayloader.js).
  * Loads only *\*.uc.js* and *\*.uc.xul* (not *userChrome.js*).
* Targets sidebar windows as well. (e.g. chrome://browser/content/web-panels.xul)
* Reads meta data only when necessary--on startup or on script update.
* Supports regex patterns for @include/@exclude by
  [prefixing with `~`](http://gist.github.com/57590).
* Supports [Greasemonkey](http://wiki.greasespot.net/Metadata_Block#.40require)
  style @require pragma that accepts a script URL and loads it beforehand.
  * The URL can be absolute or relative, but must be local.

###drawbacks
* Runs on Firefox 3.5+ only.
* Scamps workaround for <http://bugzil.la/330458>.
