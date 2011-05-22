'use strict'

const Cu = Components.utils
Cu.import('resource://gre/modules/XPCOMUtils.jsm')
Cu.import('resource://gre/modules/Services.jsm')

function UCC(){
  Cu.import('resource://uc/uc.jsm')
  Services.obs.addObserver(this, 'domwindowopened', false)
}
UCC.prototype = {
  classDescription: 'uc boot',
  classID: Components.ID('{98c6d8bf-3eae-4e3f-8dc8-f91794e9782a}'),
  contractID: '@u/c;1',
  QueryInterface: XPCOMUtils.generateQI([]),
  _xpcom_categories: [{category: 'profile-after-change'}],
  observe: function UCC_onWindowOpen(win)
    win && win.addEventListener('load', this, true),
  handleEvent: function UCC_onDocumentLoad(ev) UC.init(ev.target.defaultView),
}
var NSGetFactory = XPCOMUtils.generateNSGetFactory([UCC])
