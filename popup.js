document.addEventListener("DOMContentLoaded", async () => {
  // Get button elements
  const startButton = document.getElementById("start");
  const stopButton = document.getElementById("stop");
  const readerButton = document.getElementById("generateReaderContent");
  
  // Load saved settings
  const savedApiKey = await storageUtil.get('openaiApiKey');
  const savedLanguage = await storageUtil.get('language') || 'en-US';
  const savedVoice = await storageUtil.get('voice') || 'nova';
  
  // Set initial values
  if (savedApiKey) {
    document.getElementById("apiKey").value = "********";
    // Enable voice buttons if API key exists
    startButton.disabled = false;
    stopButton.disabled = false;
  } else {
    // Disable voice buttons if no API key
    startButton.disabled = true;
    stopButton.disabled = true;
  }
  
  document.getElementById("language").value = savedLanguage;
  document.getElementById("voice").value = savedVoice;
  
  // Save API key when it changes
  document.getElementById("apiKey").addEventListener("change", async (e) => {
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
  
  // Save language preference
  document.getElementById("language").addEventListener("change", async (e) => {
    await storageUtil.set('language', e.target.value);
    console.log('Language preference saved!');
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
