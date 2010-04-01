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
    var dirs = ['ascending', 'descending'];
    lmn.setAttribute('sortDirection', sd = dirs[(dirs.indexOf(sd) + 1) % 2]);
    UC.sort(plist, col.index, sd === 'descending');
    treebox.invalidate();
  },
};

function add(ps){
  UC.log(uneval(ps));
  ps = ps || [['<UChrm>', 1]];
  var {length} = plist;
  plist.push.apply(plist, ps);
  treebox.rowCountChanged(length - 1, ps.length);
  var row = plist.length - 1;
  treebox.ensureRowIsVisible(row);
  treebox.treeBody.focus();
  view.selection.select(row);
}
function remove(row){ try {
  if(row == null) row = tree.currentIndex;
  if(row < 0) return;
  plist.splice(row, 1);
  treebox.rowCountChanged(row, -1);
  view.selection.select(row - 1);
} catch(e){ Cu.reportError(e) }
}
function toggle(row){ try {
  if(row == null) row = tree.currentIndex;
  if(row < 0) return;
  let p = plist[row];
  p[1] = +!p[1];
  treebox.invalidateRow(row);
} catch(e){ Cu.reportError(e) }
}
function edit(shift){
  tree.startEditing(tree.currentIndex, tree.columns[shift | 0]);
}
function save(){
  var paths = {};
  for each(let [k, v] in plist) if(k) paths[k] = v;
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
  };
  add(ps);
} catch(e){ Cu.reportError(e) }}

function keydown(ev){
  if(tree.editingColumn) return;
  switch(ev.keyCode){
    case KeyEvent.DOM_VK_A:
    case KeyEvent.DOM_VK_INSERT:
    add();
    break;
    case KeyEvent.DOM_VK_D:
    case KeyEvent.DOM_VK_DELETE:
    case KeyEvent.DOM_VK_BACK_SPACE:
    remove();
    break;
    case KeyEvent.DOM_VK_E:
    case KeyEvent.DOM_VK_F2:
    case KeyEvent.DOM_VK_SPACE:
    edit(ev.shiftKey);
    break;
    case KeyEvent.DOM_VK_T:
    case KeyEvent.DOM_VK_PERIOD:
    toggle();
  }
}
function dblclick(){
  if(tree.editingColumn) return;
  add();
  edit();
}

function onload(){
  sizeToContent();
  tree = document.getElementById('paths');
  treebox = tree.boxObject;
  tree.view = view;
}
