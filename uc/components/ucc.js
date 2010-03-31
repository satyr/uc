const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');
NSGetModule = XPCOMUtils.generateNSGetModule([UCC]);

function UCC(){}
UCC.prototype = {
  classDescription: 'uc loader',
  classID: Components.ID('{98c6d8bf-3eae-4e3f-8dc8-f91794e9782a}'),
  contractID: '@uc;1',
  QueryInterface: XPCOMUtils.generateQI(
    ['nsIObserver', 'nsIDOMEventListener', 'nsIFactory']),
  _xpcom_categories:
  [{category: 'app-startup', entry: 'm-uc', service: true}],

  observe: function UCC_observe(subject, topic){
    const OS = (Cc["@mozilla.org/observer-service;1"]
                .getService(Ci.nsIObserverService));
    switch(topic){
      case 'app-startup': return OS.addObserver(this, 'final-ui-startup', 0);
      case 'final-ui-startup': return (
        (Cc['@mozilla.org/xre/app-info;1']
         .getService(Ci.nsIXULRuntime).inSafeMode) ||
        OS.addObserver(this, 'domwindowopened', 0));
      case 'domwindowopened': subject.addEventListener('load', this, 1);
    }
  },

  handleEvent: function UCC({originalTarget: doc}){
    var {location} = doc;
    if(location && location.protocol === 'chrome:')(
      Cc['@mozilla.org/moz/jssubscript-loader;1']
      .getService(Ci.mozIJSSubScriptLoader)
      .loadSubScript('chrome://uc/content/uc.js', doc.defaultView));
  },
};
