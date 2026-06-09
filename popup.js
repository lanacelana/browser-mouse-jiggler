const toggleBtn = document.getElementById('toggleBtn');
const stateText = document.getElementById('stateText');
const intervalSelect = document.getElementById('intervalSelect');
const imgUrlInput = document.getElementById('imgUrl');

// 1. Find the current active tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];
  const tabId = currentTab.id;

  // 2. Load settings for this specific tab
  chrome.storage.local.get(['enabledTabs', 'interval', 'imgUrl'], (res) => {
    const enabledTabs = (res && res.enabledTabs) || {};
    const isEnabled = !!enabledTabs[tabId];

    if (res && res.interval) intervalSelect.value = res.interval;
    if (res && res.imgUrl) imgUrlInput.value = res.imgUrl;
    
    updateUI(isEnabled);
  });

  // 3. Handle the toggle
  toggleBtn.addEventListener('click', () => {
    chrome.storage.local.get(['enabledTabs'], (res) => {
      const enabledTabs = (res && res.enabledTabs) || {};
      const newState = !enabledTabs[tabId];

      if (newState) {
        enabledTabs[tabId] = true;
      } else {
        delete enabledTabs[tabId];
      }

      const selectedInterval = intervalSelect.value;
      chrome.storage.local.set({ 
        enabledTabs, 
        interval: selectedInterval === 'random' ? 'random' : parseInt(selectedInterval),
        imgUrl: imgUrlInput.value 
      });

      chrome.runtime.sendMessage({ action: "sync" });
      updateUI(newState);
    });
  });
});

function updateUI(isEnabled) {
  stateText.innerText = isEnabled ? "JIGGLING ACTIVE" : "INACTIVE";
  stateText.style.color = isEnabled ? "#34d399" : "#f87171";
  toggleBtn.innerText = isEnabled ? "Stop Jiggling This Tab" : "Start Jiggling This Tab";
  toggleBtn.className = isEnabled ? "active" : "";
}