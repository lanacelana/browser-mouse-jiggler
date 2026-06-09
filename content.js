let jiggleInterval = null;

// Listen for updates from the popup/storage
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabledTabs || changes.interval) {
    checkStatus();
  }
});

async function checkStatus() {
  const res = await chrome.storage.local.get(['enabledTabs', 'interval', 'imgUrl']);
  const tabId = await getTabId();
  
  if (res && res.enabledTabs && res.enabledTabs[tabId]) {
    startJiggling(res.interval || 'random', res.imgUrl);
  } else {
    stopJiggling();
  }
}

function startJiggling(intervalOption, imgUrl) {
  if (jiggleInterval) return;

  const defaultCursor = "https://cdn-icons-png.flaticon.com/512/6368/6368872.png";
  const icon = imgUrl || defaultCursor;

  // Create visual ghost once (RAM efficient)
  let ghost = document.getElementById('_jig_');
  if (!ghost) {
    ghost = document.createElement('img');
    ghost.id = '_jig_';
    ghost.style.cssText = "position:fixed; width:35px; z-index:2147483647; pointer-events:none; transition: all 0.8s ease-in-out; opacity: 0.8;";
    document.body.appendChild(ghost);
  }
  ghost.src = icon;

  const performAction = () => {
    // 1. Add Randomness to bypass "Bot" detection
    const x = Math.random() * (window.innerWidth - 50);
    const y = Math.random() * (window.innerHeight - 50);

    // 2. Visual Movement
    ghost.style.left = x + "px";
    ghost.style.top = y + "px";

    // 3. Undetectable Interaction Logic
    const opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };
    
    // Trigger multiple event layers
    document.dispatchEvent(new MouseEvent('mousemove', opts));
    document.dispatchEvent(new MouseEvent('mousedown', opts));
    
    // Simulate a tiny scroll movement
    window.scrollBy(0, 1);
    setTimeout(() => window.scrollBy(0, -1), 100);

    // Set next jiggle interval based on the option
    let nextInterval;
    if (intervalOption === 'random') {
      // Random range between 2 and 7 seconds (2000ms to 7000ms)
      nextInterval = Math.random() * (7000 - 2000) + 2000;
    } else {
      const baseInterval = parseInt(intervalOption) || 3000;
      const randomOffset = Math.random() * 1000;
      nextInterval = baseInterval + randomOffset;
    }

    jiggleInterval = setTimeout(performAction, nextInterval);
  };

  performAction();
}

function stopJiggling() {
  clearTimeout(jiggleInterval);
  jiggleInterval = null;
  const ghost = document.getElementById('_jig_');
  if (ghost) ghost.remove();
}

// Helper to identify current tab within the content script
async function getTabId() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({action: "getTabId"}, (response) => {
      resolve(response.tabId);
    });
  });
}

checkStatus();