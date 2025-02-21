document.addEventListener("DOMContentLoaded", async () => {
  const apiKeyInput = document.getElementById("apiKey");
  const saveKeyButton = document.getElementById("saveKey");

  // Load saved API key when popup opens
  const savedApiKey = await storageUtil.get('openaiApiKey');
  if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
  }

  // Save API key
  saveKeyButton.addEventListener("click", async () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      await storageUtil.set('openaiApiKey', apiKey);
      alert('API key saved successfully!');
    } else {
      alert('Please enter an API key');
    }
  });

  // Existing start button functionality
  document.getElementById("start").addEventListener("click", () => {
    console.log("Requesting microphone permission");
    sendMessageToActiveTab("startVoiceSession");
    window.close();
  });

  document.getElementById("stop").addEventListener("click", () => {
    console.log("Stopping voice session");
    sendMessageToActiveTab("stopVoiceSession");
    window.close();
  });

  document.getElementById("generateReaderContent").addEventListener("click", () => {
    console.log("Generating reader content");
    sendMessageToActiveTab("generateReaderContent");
    window.close();
  });
});
