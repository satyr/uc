const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');
NSGetModule = XPCOMUtils.generateNSGetModule([UCC]);

function UCC(){
  Cu.import('resource://uc/uc.jsm');
  UC.Observer.addObserver(this, 'domwindowopened', false);
}
UCC.prototype = {
  classDescription: 'uc loader',
  classID: Components.ID('{98c6d8bf-3eae-4e3f-8dc8-f91794e9782a}'),
  contractID: '@uc;1',
  QueryInterface: XPCOMUtils.generateQI([]),
  _xpcom_categories: [{category: 'profile-after-change'}],
  observe: function UCC_onWindowOpen(win)
    win && win.addEventListener('load', this, true),
  handleEvent: function UCC_onDocumentLoad(ev) UC.init(ev.target.defaultView),
};
