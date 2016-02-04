const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components
Cu.import('resource://gre/modules/Services.jsm')
Cu.import('resource://gre/modules/PrivateBrowsingUtils.jsm')

this[this.EXPORTED_SYMBOLS = ['UC']] = {
  URL_MAIN : 'chrome://browser/content/browser.xul',
  DELAY_XUL: 333,
  RE_SCAPE : /[.?*+^$|()\{\[\\]/g,
  RE_FILE_EXT : /\.uc\.(js|xul|css)$/i,
  RE_PATH_PROP: /<(\w+)>/,
  RE_META_PAIR: /\@([\w$]+)\s+(.+)/,
  RE_META_TAIL: /==\/u/i,
  NS_MATH: 'http://www.w3.org/1998/Math/MathML',
  NS_HTM : 'http://www.w3.org/1999/xhtml',
  NS_SVG : 'http://www.w3.org/2000/svg',
  NS_EM  : 'http://www.mozilla.org/2004/em-rdf#',
  NS_XUL : 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
  bin: {__proto__: {
    toString: Object.prototype.toSource,
  }},
  get main(){
    return Services.wm.getMostRecentWindow('navigator:browser')
  },
  get paths(){
    return JSON.parse(this.pget('extensions.uc.paths'))
  },
  set paths(ps){
    return this.pset('extensions.uc.paths', JSON.stringify(ps))
  },
}

for(let f in this) if(~f.lastIndexOf('UC_', 0)) UC[f.slice(3)] = this[f]

UC.lazy(function file2url(){ return UC_file2url })
UC_lazy.call(this, function UC_file2url(){
  return Services.io.getProtocolHandler('file')
         .QueryInterface(Ci.nsIFileProtocolHandler)
         .getURLSpecFromFile
})

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
})) {
  let [name, [cid, iid]] = it
  cid = Cc[cid]
  iid = Ci[iid]
  UC.__defineGetter__(name, () => cid.createInstance(iid))
}

var clip = UC.clip = {
  flavors: {text: 'text/unicode', html: 'text/html'},
  get: function clip_get(flavor, context){
    const {clipboard: service} = Services
    if(context instanceof Ci.nsIDOMWindow)
      context = PrivateBrowsingUtils.getPrivacyContextFromWindow(context)
    function get(flavor){
      flavor = clip.flavors[flavor] || flavor
      if(!service.hasDataMatchingFlavors([flavor], 1, service.kGlobalClipboard))
        return ''
      var trans = UC.transferable, data = {}
      trans.init(context)
      trans.addDataFlavor(flavor)
      service.getData(trans, service.kGlobalClipboard)
      trans.getTransferData(flavor, data, {})
      return data.value.QueryInterface(Ci.nsISupportsString).data
    }
    return arguments.length > 1
           ? Array.map(arguments, get)
           : flavor.map ? flavor.map(get) : get(flavor)
  },
  set: function CB_set(dict, context){
    const {clipboard: service} = Services
    if(context instanceof Ci.nsIDOMWindow)
      context = PrivateBrowsingUtils.getPrivacyContextFromWindow(context)
    var trans = UC.transferable
    trans.init(context)
    for(let [flavor, data] in new Iterator(dict)){
      let ss = Cc['@mozilla.org/supports-string;1']
               .createInstance(Ci.nsISupportsString)
      ss.data = data = String(data)
      trans.addDataFlavor(flavor = clip.flavors[flavor] || flavor)
      trans.setTransferData(flavor, ss, data.length * 2)
    }
    service.setData(trans, null, service.kGlobalClipboard)
    return this
  },
}
for(let n in clip.flavors){
  let name = n
  Object.defineProperty(clip, name, {
    get: function clip_get_x(){ return this.get(name) },
    set: function clip_set_x(data){
      var dict = {}
      dict[name] = data
      this.set(dict)
    },
  })
}

function UC_log(){
  UC_pget('extensions.uc.log') &&
    Services.console.logStringMessage('uc: ' + Array.join(arguments, '|'))
  return this
}
function UC_trace(e){
  if(!e || !UC_pget('extensions.uc.log.trace')) return this
  if(e instanceof Ci.nsIException){
    for(var t = '', l = e.location; l; l = l.caller) t += l +'\n'
    t = t.replace(/^JS frame :: (?:.+ -> )?/mg, '')
  }
  else t = e.stack.replace(/@.+ -> /g, '@')
  if(t) UC_log('Stack Trace:\n'+ t)
  return this
}
function UC_file2data(file){
  var {path, lastModifiedTime} = file, data = UC.bin[path]
  if(data && data.timestamp === lastModifiedTime) return data
  data = {
    timestamp: lastModifiedTime,
    uri: Services.io.newURI(UC_file2url(file), null, null),
    includes: [], excludes: [], requires: [],
  }
  var {fileInputStream: fis, RE_META_PAIR, RE_META_TAIL} = UC
  var meta = data.meta = new Meta, line = {}
  fis.init(file, 0x01, 0444, 0)
  fis.QueryInterface(Ci.nsILineInputStream)
  while(fis.readLine(line))
    if(RE_META_PAIR.test(line.value)){
      let {$1, $2} = RegExp
      $2 = $2.trimRight()
      meta[$1] = $1 in meta ? meta[$1] +'\n'+ $2 : $2
      switch($1){
      case 'include': case 'exclude':
        data[$1 +'s'].push(UC_tester($2))
        continue
      case 'require':
        data.requires.push(Services.io.newURI($2, null, data.uri).spec)
      }
    } else if(RE_META_TAIL.test(line.value)) break
  fis.close()
  'name' in meta || (meta.name = file.leafName)
  data.includes.length || data.includes.push(UC.URL_MAIN)
  return UC.bin[path] = data
}
function UC_path2file(path){
  try {
    let file = UC.localFile
    file.initWithPath(path)
    if(file.exists()) return file
    UC_log('bad file: '+ path)
  } catch(e){ Cu.reportError(e) }
  return null
}
function UC_prop2path(q, p){
  return Services.dirsvc.get(p || q, Ci.nsILocalFile).path
}
function UC_init(win){
  if(win instanceof Ci.nsIDOMChromeWindow)
    Services.scriptloader.loadSubScript('resource://uc/uc.js', win)
}
function UC_load(win){
  var ev = win.document.createEvent('Event')
  ev.initEvent('ucload', true, true)
  if(!win.dispatchEvent(ev)) return this
  var {href} = win.location, done = this.done = {}, start = Date.now()
  for(let [path, depth] in new Iterator(UC.paths)) if(depth > 0){
    let file = UC_path2file(path.replace(UC.RE_PATH_PROP, UC_prop2path))
    if(file) march(file, depth)
  }
  function march(file, depth){
    if(file.isFile()) return touch(file)
    if(depth < 1 || file.leafName[0] == '.') return
    let files = file.directoryEntries
    while(files.hasMoreElements())
      march(files.getNext().QueryInterface(Ci.nsILocalFile), depth - 1)
  }
  function match(url){
    return url.test ? url.test(this) : url == this
  }
  function touch(file){
    if(file.isDirectory() || !UC.RE_FILE_EXT.test(file.leafName)) return
    var ext = RegExp.$1.toUpperCase(), data = UC_file2data(file)
    if(data.excludes.some(match, href) ||
       data.includes.some(match, href) ^ 1) return
    var {uri: {spec}, meta} = data
    if(spec in done) return
    for each(let rurl in data.requires) done[rurl] =
      (rurl in done ? done[rurl] +'\n' : (UC_loadJS(rurl, win), '')) +
      '-> '+ meta.name
    ext == 'XUL'
    ? win.setTimeout(UC_loadXUL, meta.delay || UC.DELAY_XUL, spec, win)
    : UC['load'+ ext](spec +'?'+ data.timestamp, win)
    done[spec] = meta
  }
  if(UC_pget('extensions.uc.log.loaded')){
    let list = Object.keys(done).map(u => done[u].name || u +'\n'+ done[u])
    list.length && UC_log(href, Date.now() - start + 'ms\n'+ list.join('\n'))
  }
  return this
}
function UC_loadJS(url, ctx){
  try { return Services.scriptloader.loadSubScript
               (url, ctx.defaultView || ctx, 'utf-8') }
  catch(e){
    if(e !== 'stop'){
      Cu.reportError(e)
      UC_trace(e)
    }
    return e
  }
}
function UC_loadXUL(url, ctx){
  (ctx.document || ctx).loadOverlay(url, null)
  return this
}
function UC_loadCSS(url, ctx){
  var doc = ctx.document || ctx
  return doc.contentType == 'application/vnd.mozilla.xul+xml'
    ? doc.insertBefore(
        doc.createProcessingInstruction(
          'xml-stylesheet',
          'href="'+ UC_hescape(url) +'"'),
        doc.documentElement)
    : doc.body.appendChild(
        UC_dom({$: 'link', rel: 'stylesheet', href: url}, doc))
}

function UC_lazy(func, name, args){
  var me = this, p = name == null ? func.name : name
  me.__defineGetter__(p, function lazyProp(){
    delete me[p]
    return me[p] = args ? func.apply(me, args) : func.call(me)
  })
  return me
}
function UC_tester(str){
  switch(str){
  case 'main' : return UC.URL_MAIN
  case '*'    : return /^/
  }
  if(str[0] == '~') return UC_re(str.slice(1))
  var ss = str.split('*')
  return ss.length == 1 ?
    str : RegExp('^'+ ss.map(UC_rescape).join('.*?') +'$')
}
function UC_options(){
  var uc = UC.main.openDialog('chrome://uc/content', 'uc')
  uc.focus()
  return uc
}
function UC_pget(key){
  var {prefs} = Services
  switch(prefs.getPrefType(key)){
  case prefs.PREF_STRING:
    return prefs.getComplexValue(key, Ci.nsISupportsString).data
  case prefs.PREF_BOOL:
    return prefs.getBoolPref(key)
  case prefs.PREF_INT:
    return prefs.getIntPref(key)
  }
}
function UC_pset(key, val){
  switch(typeof val){
  case 'boolean' : Services.prefs.setBoolPref (key, val); break
  case 'number'  : Services.prefs.setIntPref  (key, val); break
  default:
    let ss = Cc['@mozilla.org/supports-string;1']
             .createInstance(Ci.nsISupportsString)
    ss.data = val
    Services.prefs.setComplexValue(key, Ci.nsISupportsString, ss)
  }
  return val
}

function UC_re(pattern, flags){
  try {
    return RegExp(pattern, flags)
  } catch(e if e instanceof SyntaxError){
    return RegExp(UC_rescape(pattern), flags)
  }
}
function UC_rescape(str){
  return String(str).replace(UC.RE_SCAPE, '\\$&')
}
function UC_hescape(str){
  return String(str).replace(/[&<>"']/g, $ => {
    switch($){
      case "&": return "&amp;"
      case "<": return "&lt;"
      case ">": return "&gt;"
      case '"': return "&quot;"
      case "'": return "&#39;"
    }
  })
}
function UC_sort(arr, key, dsc){
  var pry = typeof key == 'function'
    ? key
    : key != null
      ? x => x[key]
      : x => x
  var sorted = [for(x of Array.slice(arr)) {k: pry(x), v: x}].sort(
    dsc
    ? (a, b) => a.k < b.k
    : (a, b) => a.k > b.k
  )
  for(let i in sorted) arr[i] = sorted[i].v
  return arr
}
function UC_dom(obj, ctx){
  if (obj.nodeType > 0) return obj
  var doc = (ctx = ctx || UC.main.document).ownerDocument || ctx
  switch(typeof obj){
  case 'string': return doc.createTextNode(obj)
  case 'xml':
    let rng = doc.createRange()
    if(ctx !== doc) rng.selectNode(ctx)
    return rng.createContextualFragment(obj.toXMLString())
  }
  if(obj.$){
    let lm = doc.createElement(obj.$)
    for(let k in obj) switch(k){
      case '$': break
      case '_': lm.appendChild(UC_dom(obj[k], lm)); break
      default: lm.setAttribute(k, obj[k])
    }
    return lm
  }
  let df = doc.createDocumentFragment()
  for(let v of obj) df.appendChild(UC_dom(v, ctx))
  return df
}
function UC_count(o){
  var n = 0
  if(o) for([] in new Iterator(o, true)) ++n
  return n
}
function UC_once(element, eventType, listener, useCapture) {
  function once(event) {
    element.removeEventListener(eventType, once, useCapture)
    return typeof listener == 'function'
           ? listener.call(this, event)
           : listener.handleEvent(event)
  }
  element.addEventListener(eventType, once, useCapture)
  return once
}

function UC_toString(){
  return [...new Iterator(this.done || 0)]
         .map(um => um.join('\n')).join('\n\n')
      || '[object UC]'
}

function Meta(){}
Meta.prototype.toString = function Meta_toString(tab){
  if(tab == null) tab = ' '
  var s = this.name, re = /^/mg
  for(let [k, v] of new Iterator(this)) if(k !== 'name')
     s += '\n@'+ k +'\n'+ v.replace(re, tab)
  return s
}
