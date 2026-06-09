(() => {
  'use strict';

  // Listen to runtime communication messages
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'getTabId' && sender.tab) {
      sendResponse({ tabId: sender.tab.id });
    }
    if (msg.action === 'sync') {
      chrome.power.requestKeepAwake('display');
    }
    return true; // Keeps the sendResponse channel open for async responses if needed
  });

  /**
   * Initializes keep-awake power settings based on stored active tabs.
   */
  function initPowerSettings() {
    chrome.storage.local.get(['enabledTabs'], (res) => {
      if (chrome.runtime.lastError) {
        console.error('[Tab Jiggler] Background storage error:', chrome.runtime.lastError);
        return;
      }
      if (res && res.enabledTabs && Object.keys(res.enabledTabs).length > 0) {
        chrome.power.requestKeepAwake('display');
      }
    });
  }

  initPowerSettings();
})();