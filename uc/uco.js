const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components
Cu.import('resource://uc/uc.jsm')
Cu.import('resource://gre/modules/Services.jsm')

var plist = [p for(p in new Iterator(UC.paths))]
var view = {
  setTree: function(treebox){ this.treebox = treebox },
  get rowCount() plist.length,
  getCellText: function(row, col) plist[row][col.index],
  setCellText: function(row, col, txt){
    plist[row][col.index] = txt.trim()
  },
  isEditable: function() true,
  isContainer: function() false,
  isSeparator: function() false,
  isSorted: function() false,
  getLevel: function() 0,
  getImageSrc: function() null,
  getParentIndex: function() -1,
  getRowProperties: function() '',
  getCellProperties: function() '',
  getColumnProperties: function() '',
  selectionChanged: function(){},
  cycleHeader: function cycleHeader(col){
    var lmn = col.element
    var sd = lmn.getAttribute('sortDirection')
    var dirs = ['ascending', 'descending', 'natural']
    lmn.setAttribute('sortDirection', sd = dirs[(dirs.indexOf(sd) + 1) % 3])
    if(sd === 'natural') return
    UC.sort(plist, col.index, sd === 'descending')
    treebox.invalidate()
  },
  canDrop: function(row, orient, dataTransfer) false,
  drop: function(row, orient, dataTransfer) false,
}

function add(ps, cb){
  ps = ps || [['<UChrm>', 1]]
  var {length} = plist
  plist.push.apply(plist, ps)
  treebox.rowCountChanged(length - 1, ps.length)
  var row = plist.length - 1
  treebox.ensureRowIsVisible(row)
  treebox.treeBody.focus()
  view.selection.select(row)
  cb && cb()
}
function remove(row){ try {
  if(row == null) row = tree.currentIndex
  if(row < 0) return
  plist.splice(row, 1)
  treebox.rowCountChanged(row, -1)
  view.selection.select(row && row - 1)
} catch(e){ Cu.reportError(e) }
}
function move(up){
  var row = tree.currentIndex
  if(up ? row < 1 : plist.length - 2 < row) return
  var her = row - (up ? 1 : -1)
  ;[plist[her], plist[row]] = [plist[row], plist[her]]
  view.selection.select(her)
}
function depth(num){
  var row = tree.currentIndex
  if(row < 0) return
  plist[row][1] = num
  treebox.invalidateRow(row)
}
function edit(shift){
  tree.startEditing(tree.currentIndex, tree.columns[shift | 0])
}
function save(){
  var paths = {}, re = /[/\\]$/
  for(let [k, v] of plist) if(k) paths[k.trim().replace(re, '')] = v & 15
  UC.paths = paths
}
function pick(mode){ try{
  const {nsIFilePicker} = Ci
  var fp = Cc['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker)
  fp.init(window, 'Add Path', nsIFilePicker['mode'+ mode])
  var dir = mode === 'GetFolder'
  if(!dir){
    let filter = '*.uc.js;*.uc.xul;*.uc.css'
    if(Services.appinfo.OS == 'Darwin') filter = filter.replace(/\.uc\./g, '')
    fp.appendFilter('uc JS/XUL/CSS', filter)
  }
  if(fp.show() !== nsIFilePicker.returnOK) return
  var ps = []
  if(dir) ps.push([fp.file.path, 1])
  else {
    let {files} = fp
    while(files.hasMoreElements())
      ps.push([files.getNext().QueryInterface(Ci.nsIFile).path, 1])
  }
  add(ps)
} catch(e){ Cu.reportError(e) }
}
function copy(all){
  if(all){
    UC.clip.text = [path for([path] of plist)].join('\n')
    return
  }
  var row = tree.currentIndex
  if(~row) UC.clip.text = plist[row][0]
}
function paste(all){
  var txt = UC.clip.text.trim()
  if(!txt) return
  if(all){
    add([[path, 1] for(path of txt.split(/[\r\n]+/))])
    return
  }
  var row = tree.currentIndex
  if(row < 0) return
  plist[row][0] = txt
  treebox.invalidateRow(row)
}

for(let k in KeyEvent) this[k.slice(6)] = KeyEvent[k]

function keydown(ev){
  if(tree.editingColumn) return
  var key = ev.keyCode
  switch(key){
  case _A: case _INSERT:
    add(0, edit)
    break
  case _R: case _DELETE: case _BACK_SPACE:
    remove()
    break
  case _E: case _F2: case _SPACE:
    edit(ev.shiftKey)
    break
  case _UP: case _DOWN:
    if(!ev.ctrlKey) return
    move(key === _UP)
    break
  case _U: case _D:
    move(key === _U)
    break
  case (_0 <= key && key <= _9 || _NUMPAD0 <= key && key <= _NUMPAD9) && key:
    depth(key % 16)
    break
  default: return
  }
  ev.preventDefault()
}
function dblclick(){
  if(tree.editingColumn) return
  add(0, edit)
}
function drag(ev) ev.dataTransfer.types.contains('application/x-moz-file')
function drop(ev){
  var dt = ev.dataTransfer, ps = []
  for(let i = 0, c = dt.mozItemCount; i < c; ++i){
    let file = dt.mozGetDataAt('application/x-moz-file', 0)
    if(file instanceof Ci.nsIFile) ps.push([file.path, 1])
  }
  add(ps)
}

function hush(ev)(ev.stopPropagation(), ev.preventDefault(), ev)

this.onload = function onload(){
  tree = document.getElementById('paths')
  treebox = tree.boxObject
  tree.view = view
}

this.onunload = function onunload(){
  tree.view = null // prevents extra getCellText() calls
}
