function addExtensionListener(listener) {
  chrome.runtime.onMessage.addListener(listener);
}

function sendMessageToActiveTab(action, data) {
  console.log("chrome", { chrome });
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: action, data: data });
    });
  } catch (error) {
    console.error("Error sending message to active tab: ", error);
  }
}

function sendMessageToCurrentWindow(action, data) {
  console.log("chrome", { chrome });
  try {
    chrome.runtime.sendMessage({ action: action, data: data });
  } catch (error) {
        console.error("Error sending message to current window: ", error);
    }
}

function sendMessage(action, data) {
  // Could not establish connection. Receiving end does not exist.
  try {
    sendMessageToActiveTab(action, data);
  } catch (error) {
    console.error("Error sending message to active tab: ", error);
    sendMessageToCurrentWindow(action, data);
  }
}

// Storage utility
const storageUtil = {
  async get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], function (result) {
        resolve(result[key]);
      });
    });
  },

  async set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, function () {
        resolve();
      });
    });
  }
};

// Make it available globally
window.storageUtil = storageUtil;

const EVENT_NAME = chrome.runtime.id;

function addDocumentListener(handler) {
  document.addEventListener(EVENT_NAME, handler);
}

function sendDocumentMessage(action, data) {
  const event = new CustomEvent(EVENT_NAME, { detail: { action, data } });
  document.dispatchEvent(event);
}
