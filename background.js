chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getTabId") {
    sendResponse({ tabId: sender.tab.id });
  }
  if (msg.action === "sync") {
    chrome.power.requestKeepAwake("display");
  }
});

// Initialize power settings
chrome.storage.local.get(['enabledTabs'], (res) => {
  if (res && res.enabledTabs && Object.keys(res.enabledTabs).length > 0) {
    chrome.power.requestKeepAwake("display");
  }
});