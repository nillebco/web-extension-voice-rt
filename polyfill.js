function addListener(listener) {
    chrome.runtime.onMessage.addListener(listener);
}

function sendMessageToActiveTab(action, data) {
    console.log({chrome});
    try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: action, data: data });
        });
    } catch (error) {
        console.error("Error sending message to active tab: ", error);
    }
}

function sendMessageToCurrentWindow(action, data) {
    try {
        chrome.runtime.sendMessage({ action: action, data: data });
    } catch (error) {
        console.error("Error sending message to current window: ", error);
    }
}

// Storage utility
const storageUtil = {
  async get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], function(result) {
        resolve(result[key]);
      });
    });
  },
  
  async set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, function() {
        resolve();
      });
    });
  }
};

// Make it available globally
window.storageUtil = storageUtil;
