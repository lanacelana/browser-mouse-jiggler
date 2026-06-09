(() => {
  'use strict';

  const DOM = {
    toggleBtn: document.getElementById('toggleBtn'),
    stateText: document.getElementById('stateText'),
    intervalSelect: document.getElementById('intervalSelect'),
    imgUrlInput: document.getElementById('imgUrl'),
    statusBox: document.querySelector('.status-box')
  };

  /**
   * Initializes the popup UI by querying the current active tab and loading its settings.
   */
  async function init() {
    try {
      // 1. Find the current active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || tabs.length === 0) {
        console.warn('[Tab Jiggler] No active tab found.');
        return;
      }
      const currentTab = tabs[0];
      const tabId = currentTab.id;

      // 2. Load settings for this tab from storage
      const res = await chrome.storage.local.get(['enabledTabs', 'interval', 'imgUrl']);
      const enabledTabs = (res && res.enabledTabs) || {};
      const isEnabled = !!enabledTabs[tabId];

      if (res && res.interval) {
        DOM.intervalSelect.value = res.interval;
      }
      if (res && res.imgUrl) {
        DOM.imgUrlInput.value = res.imgUrl;
      }

      updateUI(isEnabled);

      // 3. Setup event listeners
      DOM.toggleBtn.addEventListener('click', () => handleToggle(tabId));
    } catch (error) {
      console.error('[Tab Jiggler] Initialization error:', error);
    }
  }

  /**
   * Handles toggling the jiggle state for the tab.
   * @param {number} tabId 
   */
  async function handleToggle(tabId) {
    try {
      const res = await chrome.storage.local.get(['enabledTabs']);
      const enabledTabs = (res && res.enabledTabs) || {};
      const newState = !enabledTabs[tabId];

      if (newState) {
        enabledTabs[tabId] = true;
      } else {
        delete enabledTabs[tabId];
      }

      const selectedInterval = DOM.intervalSelect.value;
      await chrome.storage.local.set({
        enabledTabs,
        interval: selectedInterval === 'random' ? 'random' : parseInt(selectedInterval, 10),
        imgUrl: DOM.imgUrlInput.value
      });

      chrome.runtime.sendMessage({ action: 'sync' });
      updateUI(newState);
    } catch (error) {
      console.error('[Tab Jiggler] Error toggling status:', error);
    }
  }

  /**
   * Updates the popup UI state based on whether jiggling is active.
   * @param {boolean} isEnabled 
   */
  function updateUI(isEnabled) {
    DOM.stateText.innerText = isEnabled ? "JIGGLIN' AWAY!" : "NO JIGGLE, MATE";
    DOM.stateText.style.color = isEnabled ? 'var(--accent-gold)' : 'var(--text-muted)';
    DOM.toggleBtn.innerText = isEnabled ? 'Whoa, stop jiggling!' : 'Give it a go, mate!';
    DOM.toggleBtn.className = isEnabled ? 'active' : '';

    if (DOM.statusBox) {
      if (isEnabled) {
        DOM.statusBox.classList.add('active');
      } else {
        DOM.statusBox.classList.remove('active');
      }
    }
  }

  // Bootstrap popup
  document.addEventListener('DOMContentLoaded', init);
})();