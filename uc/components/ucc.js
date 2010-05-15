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

  observe: function UCC_observe(subject, topic){ switch(topic){
    case 'app-startup':
    Cu.import('resource://uc/uc.jsm');
    return UC.Observer.addObserver(this, 'final-ui-startup', false);
    case 'final-ui-startup':
    if(UC.AppInfo.inSafeMode) return;
    return UC.Observer.addObserver(this, 'domwindowopened',  false);
    case 'domwindowopened': subject.addEventListener('load', this, true);
  }},
  handleEvent: function UCC_handleEvent(ev) UC.init(ev.target.defaultView),
};
