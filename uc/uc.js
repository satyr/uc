({classes: Cc, interfaces: Ci, utils: Cu, results: Cr}) = Components

;(UC = {__proto__: Cu.import('resource://uc/uc.jsm', null).UC}).load(self)

UC.prefs.get('subwindows') && document.documentElement.addEventListener(
  'DOMContentLoaded', function UC_onContentLoad(ev) UC.init(ev.target), true)

if(location.href === UC.URL_MAIN){
  document.getElementById('menu_ToolsPopup').appendChild(UC.dom({
    $: 'menuitem', label: 'uc', accesskey: 'u', oncommand: 'UC.options()',
    class: 'menuitem-iconic',
    image: 'resource://uc/chrome/icons/default/uc.ico',
  }))
}
