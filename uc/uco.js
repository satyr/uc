const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
Cu.import('resource://uc/uc.jsm');

var plist = [p for(p in new Iterator(UC.paths))];
var view = {
  setTree: function(treebox){ this.treebox = treebox },
  get rowCount() plist.length,
  getCellText: function(row, col) plist[row][col.index],
  setCellText: function(row, col, txt){
    if(txt){
      plist[row][col.index] = txt;
      update();
    } else remove(row);
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
    tree.boxObject.invalidate();
  },
};

function add(mode){ try{
  const {nsIFilePicker} = Ci;
  var fp = Cc['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
  fp.init(window, 'Add Path', nsIFilePicker['mode'+ mode]);
  var dir = mode === 'GetFolder';
  dir || fp.appendFilter('uc js/xul', '*.uc.js;*.uc.xul');
  if(fp.show() !== nsIFilePicker.returnOK) return;
  var {length} = plist;
  if(dir) plist.push([fp.file.path, 1]);
  else {
    let {files} = fp;
    while(files.hasMoreElements())
      plist.push([files.getNext().QueryInterface(Ci.nsIFile).path, 1]);
  };
  update();
  var {boxObject} = tree;
  boxObject.rowCountChanged(length, plist.length - length);
  var row = plist.length - 1;
  boxObject.ensureRowIsVisible(row);
  boxObject.treeBody.focus();
  view.selection.select(row);
} catch(e){ Cu.reportError(e) }}

function remove(row){ try{
  if(row == null) row = tree.currentIndex;
  if(row < 0) return;
  plist.splice(row, 1);
  update();
  tree.boxObject.rowCountChanged(row, -1);
  view.selection.select(row - 1);
} catch(e){ Cu.reportError(e) }}

function keydown(ev){
  if(tree.editingColumn) return;
  switch(ev.keyCode){
    case KeyEvent.DOM_VK_E:
    case KeyEvent.DOM_VK_F2:
    case KeyEvent.DOM_VK_SPACE:
    tree.startEditing(tree.currentIndex, tree.columns[+ev.shiftKey]);
    break;
    case KeyEvent.DOM_VK_D:
    case KeyEvent.DOM_VK_DELETE:
    case KeyEvent.DOM_VK_BACK_SPACE:
    remove();
  }
}

function update(){
  var paths = {};
  for each(let [k, v] in plist) paths[k] = v;
  UC.paths = paths;
}

function onload(){
  tree = document.getElementById('paths');
  tree.view = view;
}
