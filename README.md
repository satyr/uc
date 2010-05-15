#uc
is a [Firefox](http://firefox.com) extension that allows you to run arbitrary local scripts in chrome windows.
In short, [userChromeJS](http://userchromejs.mozdev.org/) + [subscriptoverlayloader.js](http://stashbox.org/26086/subscriptoverlayloader.js).

###usage
Choose script paths and depths in options (Tools -> uc) to autoload according to their meta data block.

* If directory, all *\*.uc.{js,xul,css}* files below it up to specified depth are loaded.
* If depth is 0, the path is ignored.
* The default setting has a single
  _<[UChrm](https://developer.mozilla.org/index.php?title=en/File_I%2F%2FO)>_
  meaning that it loads the *chrome* directory in your current profile
  as does subscriptoverlayloader. Note that *userChrome.js* isn't loaded.

###supported metadata
The syntax is roughly identical to [Greasemonkey's](http://wiki.greasespot.net/Metadata_Block).

* __@name__
  The script name.

* __@include__ / __@exclude__
  The URL onto which this script is/isn't loaded.
  * `*` are wildcards.
  * If prefixed with `~`, the rest is treated as regular expression pattern.
    ([example](http://gist.github.com/57590))

* __@require__
  Accepts a script URL and loads it beforehand.
  * The URL can be absolute or relative, but must be local.
  * Will not load the same script twice for a window.

* __@delay__
  The delay before overlay in milliseconds. XUL only.

* @(whatever)
  All other meta data are stored simply as text data.
  `UC` object defined in each window keeps them.

###improvements from userChromeJS + subscriptoverlayloader.js
* Lets you specify files/directories to load.
* Targets subwindows as well, such as about:config or the sidebar UIs.
* Reads meta data only when necessary--on startup or on script update.
* Regex in @include/@exclude.
* @require

###drawbacks
* Runs on Firefox 3.5+ only.
* Scamps workaround for <http://bugzil.la/330458>.
