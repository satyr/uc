({classes: Cc, interfaces: Ci, utils: Cu, results: Cr}) = Components;

UC = userChrome = {
  __proto__: Cu.import('resource://uc/uc.jsm', null).UC,
};
if(location.href === UC.URL_MAIN && UC.prefs.get('extensions.uc.sidebar')){
  document.getElementById('sidebar').addEventListener(
    'load', function UC_onSidebar(){
      if(this.currentURI.scheme === 'chrome') UC.load(this.contentWindow);
    }, true);
}
UC.load(self);
