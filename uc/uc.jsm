const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
Cu.import('resource://uc/prefs.jsm');

var EXPORTED_SYMBOLS = ['UC'], UC = {
  URL_MAIN: 'chrome://browser/content/browser.xul',
  DELAY_JS : 0,
  DELAY_XUL: 333,
  RE_SCAPE: /[.?*+^$|()\{\[\\]/g,
  RE_FILE_EXT : /\.uc\.(js|xul)$/i,
  RE_PATH_PROP: /<(\w+)>/,
  RE_META_PAIR: /\@([\w$]+)\s+([^\r\n]+)/,
  RE_META_TAIL: /==\/u/i,
  NS_HTM: 'http://www.w3.org/1999/xhtml',
  NS_XUL: 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
  bin: {__proto__:{
    toString: function UC_bin_toString() uneval(this),
    valueOf: function UC_bin_valueOf(hint){ switch(hint){
      case 'object'   : return this;
      case 'number'   : return this.__count__;
      case 'undefined': return [p for(p in this)].join('\n');
    }},
    __iterator__: function UC_bin_iterator(wk) new Iterator(this, wk),
  }},
  prefs: Preferences,
  get main UC_get_main()
    UC.WindowMediator.getMostRecentWindow('navigator:browser'),
  get paths UC_get_paths()
    JSON.parse(Preferences.get('extensions.uc.paths')),
  set paths UC_set_paths(ps)
    Preferences.set('extensions.uc.paths', JSON.stringify(ps)),
};

for(let f in this) if(~f.lastIndexOf('UC_', 0)) UC[f.slice(3)] = this[f];

UC.lazyp(function file2url()(
  UC.IO.getProtocolHandler('file').QueryInterface(Ci.nsIFileProtocolHandler)
  .getURLSpecFromFile));

for(let [name, ids] in new Iterator({
  IO:
  ['@mozilla.org/network/io-service;1',
   'nsIIOService'],
  Console:
  ['@mozilla.org/consoleservice;1',
   'nsIConsoleService'],
  Loader:
  ['@mozilla.org/moz/jssubscript-loader;1',
   'mozIJSSubScriptLoader'],
  Properties:
  ['@mozilla.org/file/directory_service;1',
   'nsIProperties'],
  WindowMediator:
  ['@mozilla.org/appshell/window-mediator;1',
   'nsIWindowMediator'],
})) UC.lazyp(UC_service, name, ids);

for(let it in new Iterator({
  localFile:
  ['@mozilla.org/file/local;1',
   'nsILocalFile'],
  fileInputStream:
  ['@mozilla.org/network/file-input-stream;1',
   'nsIFileInputStream'],
})) let([name, [cid, iid]] = it){
  cid = Cc[cid];
  iid = Ci[iid];
  UC.__defineGetter__(name, function UC_i() cid.createInstance(iid));
}

function UC_log(){
  UC.Console.logStringMessage('uc: ' + Array.join(arguments, ' '));
  return this;
}
function UC_data(file){
  var {path, lastModifiedTime} = file, data = UC.bin[path];
  if(data && data.timestamp === lastModifiedTime) return data;
  data = {
    timestamp: lastModifiedTime, includes: [], excludes: [], requires: [],
  };
  var {fileInputStream: fis, RE_META_PAIR, RE_META_TAIL} = UC;
  var meta = {}, line = {};
  fis.init(file, 0x01, 0444, 0);
  fis.QueryInterface(Ci.nsILineInputStream);
  while(fis.readLine(line))
    if(RE_META_PAIR.test(line.value)){
      let {$1, $2} = RegExp;
      switch($1){
        case 'include': case 'exclude': case 'require':
        data[$1 +'s'].push(UC_tester($2));
        continue;
      }
      meta[$1] = $1 in meta ? meta[$1] +'\n'+ $2 : $2;
    } else if(RE_META_TAIL.test(line.value)) break;
  fis.close();
  if(!meta.name) meta.name = file.leafName;
  data.meta = meta;
  data.includes.length || data.includes.push(UC.URL_MAIN);
  return UC.bin[path] = data;
}
function UC_file(path){
  try {
    let file = UC.localFile;
    file.initWithPath(path);
    if(file.exists()) return file;
    UC_log('bad file: ' + path);
  } catch(e){ Cu.reportError(e) }
  return null;
}
function UC_tester(str){
  switch(str){
    case 'main': return UC.URL_MAIN;
    case '*': return /^/;
  }
  if(str[0] === '~') return UC_re(str.slice(1));
  var ss = str.split('*');
  return ss.length === 1 ?
    str : RegExp('^'+ ss.map(UC_rescape).join('.*?') +'$');
}
function UC_prop2path(q, p) UC.Properties.get(p || q, Ci.nsILocalFile).path;
function UC_load(win){
  var {href} = win.location, done = {}, start = Date.now();
  for(let [path, on] in new Iterator(UC.paths)) if(on){
    let file = UC_file(path.replace(UC.RE_PATH_PROP, UC_prop2path));
    if(!file) continue;
    if(file.isDirectory()){
      let files = file.directoryEntries;
      while(files.hasMoreElements())
        touch(files.getNext().QueryInterface(Ci.nsILocalFile));
    } else touch(file);
  }
  function match(url) url.test ? url.test(this) : url == this;
  function touch(file){
    if(file.isDirectory() || !UC.RE_FILE_EXT.test(file.leafName)) return;
    var ext = RegExp.$1.toUpperCase(), data = UC_data(file);
    if(data.excludes.some(match, href) ||
       data.includes.some(match, href) ^ 1) return;
    var url = UC.file2url(file);
    if(url in done) return;
    //ToDo: load requires
    win.setTimeout(UC['load'+ ext], UC['DELAY_'+ ext], url, win);
    done[url] = data.meta.name;
  }
  var loaded = [name for each(name in done)];
  if(loaded.length && UC.prefs.get('extensions.uc.log.loaded'))
    UC_log(href, Date.now() - start + '[ms]\n'+ loaded.join('\n'));
  return this;
}
function UC_loadJS(url, win){
  try { UC.Loader.loadSubScript(url, win) }
  catch(e){ e === 'stop' || Cu.reportError(e) }
  return this;
}
function UC_loadXUL(url, win){
  win.document.loadOverlay(url, null);
  return this;
}
function UC_lazyp(func, name, args){
  var me = this, p = name == null ? func.name : name;
  me.__defineGetter__(p, function lazyProp(){
    delete me[p];
    return me[p] = args ? func.apply(me, args) : func.call(me);
  });
  return me;
}
function UC_service(c, i) Cc[c].getService(Ci[i]);
function UC_options() UC.main.openDialog('chrome://uc/content');
function UC_re(pattern, flags){
  try {
    return RegExp(pattern, flags);
  } catch(e if e instanceof SyntaxError){
    return RegExp(UC_rescape(pattern), flags);
  }
}
function UC_rescape(str) String(str).replace(UC.RE_SCAPE, '\\$&');
function UC_sort(arr, key, dsc){
  var pry = (
    typeof key === 'function' ? key :
    key != null
    ? function pry(x) x[key]
    : function idt(x) x);
  var sorted = [{k: pry(x), v: x} for([, x] in new Iterator(arr))].sort(
    dsc
    ? function dsc(a, b) a.k < b.k
    : function asc(a, b) a.k > b.k);
  for(let i in sorted) arr[i] = sorted[i].v;
  return arr;
}
function UC_toString() '[object UC]';
