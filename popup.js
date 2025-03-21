import { storageUtil, sendMessageToActiveTab } from "./polyfill";

document.addEventListener("DOMContentLoaded", async () => {
  // Get button elements
  const startButton = document.getElementById("start");
  const stopButton = document.getElementById("stop");
  const readerButton = document.getElementById("generateReaderContent");
  const apiKeyInput = document.getElementById("apiKey");
  const keyServerInput = document.getElementById("keyServer");

  // Load saved settings
  const savedApiKey = await storageUtil.get('openaiApiKey');
  const savedVoice = await storageUtil.get('voice') || 'coral';
  const savedKeyServer = await storageUtil.get('keyServer');

  // Set initial values
  if (savedApiKey || savedKeyServer) {
    if (savedApiKey) {
      apiKeyInput.value = "********";
    }
    // Enable voice buttons if API key exists
    startButton.disabled = false;
    stopButton.disabled = false;
  } else {
    // Disable voice buttons if no API key
    startButton.disabled = true;
    stopButton.disabled = true;
  }

  if (savedKeyServer) {
    keyServerInput.value = savedKeyServer;
    apiKeyInput.disabled = true;
  }

  document.getElementById("voice").value = savedVoice;

  // Handle key server changes
  keyServerInput.addEventListener("change", async (e) => {
    const keyServer = e.target.value.trim();
    await storageUtil.set('keyServer', keyServer);
    
    if (keyServer) {
      apiKeyInput.disabled = true;
      apiKeyInput.value = "********";
      startButton.disabled = false;
      stopButton.disabled = false;
    } else {
      apiKeyInput.disabled = false;
      // If no key server and no API key, disable buttons
      if (!await storageUtil.get('openaiApiKey')) {
        startButton.disabled = true;
        stopButton.disabled = true;
      }
    }
  });

  // Save API key when it changes
  apiKeyInput.addEventListener("change", async (e) => {
    const apiKey = e.target.value.trim();
    if (apiKey && apiKey !== "********") {
      await storageUtil.set('openaiApiKey', apiKey);
      console.log('API key saved successfully!');
      // Enable voice buttons when API key is set
      startButton.disabled = false;
      stopButton.disabled = false;
    } else if (apiKey === "") {
      // If API key is cleared, disable buttons and remove from storage
      await storageUtil.set('openaiApiKey', null);
      startButton.disabled = true;
      stopButton.disabled = true;
    }
  });

  // Save voice preference
  document.getElementById("voice").addEventListener("change", async (e) => {
    await storageUtil.set('voice', e.target.value);
    console.log('Voice preference saved!');
  });

  // Action buttons
  startButton.addEventListener("click", () => {
    console.log("Starting voice session");
    sendMessageToActiveTab("startVoiceSession");
    window.close();
  });

  stopButton.addEventListener("click", () => {
    console.log("Stopping voice session");
    sendMessageToActiveTab("stopVoiceSession");
    window.close();
  });

  readerButton.addEventListener("click", () => {
    console.log("Generating reader content");
    sendMessageToActiveTab("generateReaderContent");
    window.close();
  });
});
