({classes: Cc, interfaces: Ci, utils: Cu, results: Cr}) = Components;

UC = userChrome = {
  __proto__: Cu.import('resource://uc/uc.jsm', null).UC,
};

UC.load(self);

if(location.href === UC.URL_MAIN){
  if(UC.prefs.get('extensions.uc.sidebar'))
    document.getElementById('sidebar').addEventListener(
      'load', function UC_onSidebar(){
        if(this.currentURI.scheme === 'chrome') UC.load(this.contentWindow);
      }, true);
  let mi = document.createElement('menuitem');
  mi.setAttribute('label', 'uc');
  mi.setAttribute('accesskey', 'u');
  mi.setAttribute('oncommand', 'UC.options()');
  document.getElementById('menu_ToolsPopup').appendChild(mi);
}
