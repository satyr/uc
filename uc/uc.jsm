const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
const TO_S = Object.prototype.toString;

var EXPORTED_SYMBOLS = ['UC'], UC = {
  URL_MAIN: 'chrome://browser/content/browser.xul',
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
      case 'number'   : return UC_count(this);
      case 'undefined': return [p for(p in this)].join('\n');
    }},
    __iterator__: function UC_bin_iterator(wk) new Iterator(this, wk),
  }},
  get main() UC.WindowMediator.getMostRecentWindow('navigator:browser'),
  get paths() JSON.parse(this.prefs.get('paths')),
  set paths(ps) this.prefs.set('paths', JSON.stringify(ps)),
};

Cu.import('resource://uc/prefs.jsm', UC);
UC.prefs = new UC.Preferences('extensions.uc.');

for(let f in this) if(~f.lastIndexOf('UC_', 0)) UC[f.slice(3)] = this[f];

UC.lazyp(function file2url() UC_file2url);
UC_lazyp.call(this, function UC_file2url()(
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
  Dir:
  ['@mozilla.org/file/directory_service;1',
   'nsIProperties'],
  WindowMediator:
  ['@mozilla.org/appshell/window-mediator;1',
   'nsIWindowMediator'],
  Clipboard:
  ['@mozilla.org/widget/clipboard;1',
   'nsIClipboard'],
})) UC.lazyp(UC_service, name, ids);

for(let it in new Iterator({
  localFile:
  ['@mozilla.org/file/local;1',
   'nsILocalFile'],
  fileInputStream:
  ['@mozilla.org/network/file-input-stream;1',
   'nsIFileInputStream'],
  transferable:
  ['@mozilla.org/widget/transferable;1',
   'nsITransferable'],
})) let([name, [cid, iid]] = it){
  cid = Cc[cid];
  iid = Ci[iid];
  UC.__defineGetter__(name, function UC_i() cid.createInstance(iid));
}

var CB = UC.clipb = {
  flavors: {text: 'text/unicode', html: 'text/html'},
  get: function CB_get(flavor){
    const {service, flavors} = CB;
    const {kGlobalClipboard} = service;
    function get(flavor){
      flavor = flavors[flavor] || flavor;
      if(!service.hasDataMatchingFlavors([flavor], 1, kGlobalClipboard))
        return '';
      var trans = UC.transferable, data = {};
      trans.addDataFlavor(flavor);
      service.getData(trans, kGlobalClipboard);
      trans.getTransferData(flavor, data, {});
      return data.value.QueryInterface(Ci.nsISupportsString).data;
    }
    return (
      arguments.length > 1
      ? Array.map(arguments, get)
      : flavor.map ? flavor.map(get) : get(flavor));
  },
  set: function CB_set(dict){
    const {service, flavors} = CB;
    var trans = UC.transferable;
    for(let [flavor, data] in new Iterator(dict)){
      let ss = (Cc['@mozilla.org/supports-string;1']
                .createInstance(Ci.nsISupportsString));
      ss.data = data = String(data);
      trans.addDataFlavor(flavor = flavors[flavor] || flavor);
      trans.setTransferData(flavor, ss, data.length * 2);
    }
    service.setData(trans, null, service.kGlobalClipboard);
    return this;
  },
};
UC_lazyp.call(CB, function service() UC.Clipboard);
for(let n in CB.flavors) let(name = n){
  CB.__defineGetter__(name, function CB_get_flavor() this.get(name));
  CB.__defineSetter__(name, function CB_set_flavor(data){
    var dict = {};
    dict[name] = data;
    this.set(dict);
  });
}

function UC_log(){
  UC.Console.logStringMessage('uc: ' + Array.join(arguments, ' '));
  return this;
}
function UC_trace(msg)(
  UC_log((msg || 'Stack Trace:') +
         Error().stack.replace(/^[^\n]+\n[^\n]+/, '')));
function UC_file2data(file){
  var {path, lastModifiedTime} = file, data = UC.bin[path];
  if(data && data.timestamp === lastModifiedTime) return data;
  data = {
    timestamp: lastModifiedTime,
    uri: UC.IO.newURI(UC_file2url(file), null, null),
    includes: [], excludes: [], requires: [],
  };
  var {fileInputStream: fis, RE_META_PAIR, RE_META_TAIL} = UC;
  var meta = {}, line = {};
  fis.init(file, 0x01, 0444, 0);
  fis.QueryInterface(Ci.nsILineInputStream);
  while(fis.readLine(line))
    if(RE_META_PAIR.test(line.value)){
      let {$1, $2} = RegExp;
      $2 = $2.trimRight();
      switch($1){
        case 'include': case 'exclude':
        data[$1 +'s'].push(UC_tester($2));
        continue;
        case 'require':
        data.requires.push(UC.IO.newURI($2, null, data.uri).spec);
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
function UC_path2file(path){
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
function UC_prop2path(q, p) UC.Dir.get(p || q, Ci.nsILocalFile).path;
function UC_load(win){
  var {href} = win.location, done = {}, start = Date.now();
  for(let [path, depth] in new Iterator(UC.paths)) if(depth > 0){
    let file = UC_path2file(path.replace(UC.RE_PATH_PROP, UC_prop2path));
    if(file) march(file, depth);
  }
  function march(file, depth){
    if(file.isFile()) return touch(file);
    if(depth < 1) return;
    let files = file.directoryEntries;
    while(files.hasMoreElements())
      march(files.getNext().QueryInterface(Ci.nsILocalFile), depth - 1);
  }
  function match(url) url.test ? url.test(this) : url == this;
  function touch(file){
    if(file.isDirectory() || !UC.RE_FILE_EXT.test(file.leafName)) return;
    var ext = RegExp.$1.toUpperCase(), data = UC_file2data(file);
    if(data.excludes.some(match, href) ||
       data.includes.some(match, href) ^ 1) return;
    var {spec} = data.uri;
    if(spec in done) return;
    for each(let rurl in data.requires) if(!(rurl in done)){
      UC_loadJS(rurl, win);
      done[rurl] = '@'+ rurl;
    }
    if(ext === 'JS') UC_loadJS(spec, win);
    else win.setTimeout(UC_loadXUL, UC.DELAY_XUL, spec, win);
    done[spec] = data.meta.name;
  }
  var loaded = [name for each(name in done)];
  if(loaded.length && UC.prefs.get('log.loaded'))
    UC_log(href, Date.now() - start + 'ms\n'+ loaded.join('\n'));
  return this;
}
function UC_loadJS(url, ctx){
  try { return UC.Loader.loadSubScript(url, ctx.defaultView || ctx) }
  catch(e){
    if(e !== 'stop') Cu.reportError(e);
    return e;
  }
}
function UC_loadXUL(url, ctx){
  (ctx.document || ctx).loadOverlay(url, null);
  return this;
}
function UC_loadCSS(url, ctx){
  var doc = ctx.document || ctx;
  return (
    doc.contentType === 'application/vnd.mozilla.xul+xml'
    ? doc.insertBefore(
      doc.createProcessingInstruction(
        'xml-stylesheet',
        <_ href={url}/>.toXMLString().slice(3, -2)),
      doc.documentElement)
    : doc.body.appendChild(
      UC_dom({$: 'link', rel: 'stylesheet', href: url}, doc)));
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
function UC_options(){
  var uc = UC.main.openDialog('chrome://uc/content', 'uc');
  uc.focus();
  return uc;
}
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
  var sorted = [{k: pry(x), v: x} for each(x in Array.slice(arr))].sort(
    dsc
    ? function dsc(a, b) a.k < b.k
    : function asc(a, b) a.k > b.k);
  for(let i in sorted) arr[i] = sorted[i].v;
  return arr;
}
function UC_dom(obj, ctx){
  if (obj.nodeType > 0) return obj;
  var doc = (ctx = ctx || UC.main.document).ownerDocument || ctx;
  switch(typeof obj){
    case 'string': return doc.createTextNode(obj);
    case 'xml':
    let rng = doc.createRange();
    if(ctx !== doc) rng.selectNode(ctx);
    return rng.createContextualFragment(obj.toXMLString());
  }
  if(obj.$){
    let lm = doc.createElement(obj.$);
    for(let k in new Iterator(obj, true)) switch(k){
      case '$': break;
      case '_': lm.appendChild(UC_dom(obj[k], lm)); break;
      default: lm.setAttribute(k, obj[k]);
    }
    return lm;
  }
  let df = doc.createDocumentFragment();
  for each(let v in obj) df.appendChild(UC_dom(v, ctx));
  return df;
}
function UC_type(o) TO_S.call(o).slice(8, -1);
function UC_once(target, type, listener, capture){
  function listener1(event){
    target.removeEventListener(type, listener1, capture);
    return (
      typeof listener === "function"
      ? listener.call(this, event)
      : listener.handleEvent(event));
  }
  target.addEventListener(type, listener1, capture);
  return listener1;
}
function UC_count(o){
  var n = 0;
  if(o) for([] in new Iterator(o, true)) ++n;
  return n;
}
function UC_toString() '[object UC]';
