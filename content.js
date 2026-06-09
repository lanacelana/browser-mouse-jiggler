(() => {
  'use strict';

  const CONFIG = {
    DEFAULT_CURSOR: 'https://cdn-icons-png.flaticon.com/512/6368/6368872.png',
    RANDOM_MIN_MS: 2000,
    RANDOM_MAX_MS: 7000,
    DEFAULT_INTERVAL_MS: 3000,
    SCROLL_RESET_MS: 100,
    GHOST_ID: '_jig_'
  };

  let jiggleTimeoutId = null;
  let scrollTimeoutId = null;

  // Listen for storage updates
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabledTabs || changes.interval) {
      checkStatus();
    }
  });

  /**
   * Checks the storage status for the current tab and starts/stops jiggling.
   */
  async function checkStatus() {
    try {
      const res = await chrome.storage.local.get(['enabledTabs', 'interval', 'imgUrl']);
      const tabId = await getTabId();

      if (res && res.enabledTabs && res.enabledTabs[tabId]) {
        startJiggling(res.interval || 'random', res.imgUrl);
      } else {
        stopJiggling();
      }
    } catch (error) {
      console.error('[Tab Jiggler] Error checking status:', error);
    }
  }

  /**
   * Helper to retrieve current tab ID by messaging background service worker.
   * @returns {Promise<number>}
   */
  async function getTabId() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'getTabId' }, (response) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        if (response && response.tabId !== undefined) {
          resolve(response.tabId);
        } else {
          reject(new Error('Failed to get tab ID'));
        }
      });
    });
  }

  /**
   * Starts the jiggler loop.
   * @param {string|number} intervalOption 
   * @param {string} imgUrl 
   */
  function startJiggling(intervalOption, imgUrl) {
    if (jiggleTimeoutId) return;

    const icon = imgUrl || CONFIG.DEFAULT_CURSOR;

    // Create or reuse visual ghost cursor (RAM efficient)
    let ghost = document.getElementById(CONFIG.GHOST_ID);
    if (!ghost) {
      ghost = document.createElement('img');
      ghost.id = CONFIG.GHOST_ID;
      ghost.style.cssText = `
        position: fixed;
        width: 35px;
        z-index: 2147483647;
        pointer-events: none;
        transition: all 0.8s ease-in-out;
        opacity: 0.8;
      `;
      document.body.appendChild(ghost);
    }
    ghost.src = icon;

    const performAction = () => {
      // 1. Calculate random movement coordinates
      const x = Math.random() * (window.innerWidth - 50);
      const y = Math.random() * (window.innerHeight - 50);

      // 2. Animate visual cursor
      ghost.style.left = `${x}px`;
      ghost.style.top = `${y}px`;

      // 3. Dispatch interaction events
      const eventOpts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };
      document.dispatchEvent(new MouseEvent('mousemove', eventOpts));
      document.dispatchEvent(new MouseEvent('mousedown', eventOpts));

      // 4. Simulate subtle scroll interaction to keep pages active
      window.scrollBy(0, 1);
      scrollTimeoutId = setTimeout(() => {
        window.scrollBy(0, -1);
      }, CONFIG.SCROLL_RESET_MS);

      // 5. Determine next interval delay
      let delayMs;
      if (intervalOption === 'random') {
        delayMs = Math.random() * (CONFIG.RANDOM_MAX_MS - CONFIG.RANDOM_MIN_MS) + CONFIG.RANDOM_MIN_MS;
      } else {
        const baseInterval = parseInt(intervalOption, 10) || CONFIG.DEFAULT_INTERVAL_MS;
        const randomOffset = Math.random() * 1000;
        delayMs = baseInterval + randomOffset;
      }

      jiggleTimeoutId = setTimeout(performAction, delayMs);
    };

    performAction();
  }

  /**
   * Stops the jiggler loop and cleans up DOM elements and timeouts.
   */
  function stopJiggling() {
    if (jiggleTimeoutId) {
      clearTimeout(jiggleTimeoutId);
      jiggleTimeoutId = null;
    }
    if (scrollTimeoutId) {
      clearTimeout(scrollTimeoutId);
      scrollTimeoutId = null;
    }

    const ghost = document.getElementById(CONFIG.GHOST_ID);
    if (ghost) {
      ghost.remove();
    }
  }

  // Self initialize
  checkStatus();
})();