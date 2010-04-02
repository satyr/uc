const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
Cu.import('resource://uc/uc.jsm');

var plist = [p for(p in new Iterator(UC.paths))];
var view = {
  setTree: function(treebox){ this.treebox = treebox },
  get rowCount() plist.length,
  getCellText: function(row, col) plist[row][col.index],
  setCellText: function(row, col, txt){
    plist[row][col.index] = txt.trim();
  },
  isEditable: function() true,
  isContainer: function() false,
  isSeparator: function() false,
  isSorted: function() false,
  getLevel: function() 0,
  getImageSrc: function() null,
  getRowProperties: function(){},
  canDropBeforeAfter: function() false,
  canDrop: function() false,
  getParentIndex: function() -1,
  getCellProperties: function(row, col, props){},
  getColumnProperties: function(){},
  selectionChanged: function(){},
  cycleHeader: function cycleHeader(col){
    var lmn = col.element;
    var sd = lmn.getAttribute('sortDirection');
    var dirs = ['ascending', 'descending', 'natural'];
    lmn.setAttribute('sortDirection', sd = dirs[(dirs.indexOf(sd) + 1) % 3]);
    if(sd === 'natural') return;
    UC.sort(plist, col.index, sd === 'descending');
    treebox.invalidate();
  },
};

function add(ps){
  ps = ps || [['<UChrm>', 1]];
  var {length} = plist;
  plist.push.apply(plist, ps);
  treebox.rowCountChanged(length - 1, ps.length);
  var row = plist.length - 1;
  treebox.ensureRowIsVisible(row);
  treebox.treeBody.focus();
  view.selection.select(row);
  edit();
}
function remove(row){ try {
  if(row == null) row = tree.currentIndex;
  if(row < 0) return;
  plist.splice(row, 1);
  treebox.rowCountChanged(row, -1);
  view.selection.select(row - 1);
} catch(e){ Cu.reportError(e) }
}
function depth(num){
  var row = tree.currentIndex;
  if(row < 0) return;
  plist[row][1] = num;
  treebox.invalidateRow(row);
}
function edit(shift){
  tree.startEditing(tree.currentIndex, tree.columns[shift | 0]);
}
function save(){
  var paths = {}, re = /[/\\]$/;
  for each(let [k, v] in plist) if(k) paths[k.trim().replace(re, '')] = v & 15;
  UC.paths = paths;
}
function pick(mode){ try{
  const {nsIFilePicker} = Ci;
  var fp = Cc['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
  fp.init(window, 'Add Path', nsIFilePicker['mode'+ mode]);
  var dir = mode === 'GetFolder';
  dir || fp.appendFilter('uc JS/XUL', '*.uc.js;*.uc.xul');
  if(fp.show() !== nsIFilePicker.returnOK) return;
  var ps = [];
  if(dir) ps.push([fp.file.path, 1]);
  else {
    let {files} = fp;
    while(files.hasMoreElements())
      ps.push([files.getNext().QueryInterface(Ci.nsIFile).path, 1]);
  }
  add(ps);
} catch(e){ Cu.reportError(e) }}

for(let k in KeyEvent) this[k.slice(6)] = KeyEvent[k];

function keydown(ev){
  if(tree.editingColumn) return;
  var {keyCode} = ev;
  switch(keyCode){
    case (_0 <= keyCode && keyCode <= _9 ||
          _NUMPAD0 <= keyCode && keyCode <= _NUMPAD9) && keyCode:
    depth(keyCode % 16);
    break;
    case _A:
    case _INSERT:
    add();
    break;
    case _D:
    case _DELETE:
    case _BACK_SPACE:
    remove();
    break;
    case _E:
    case _F2:
    case _SPACE:
    edit(ev.shiftKey);
    break;
    default: return;
  }
  ev.preventDefault();
}
function dblclick(){
  if(tree.editingColumn) return;
  add();
}

function onload(){
  tree = document.getElementById('paths');
  treebox = tree.boxObject;
  tree.view = view;
}

function onunload(){
  tree.view = null; // prevents extra getCellText() calls
}
