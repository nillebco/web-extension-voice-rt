async function getUserPermission() {
  return new Promise((resolve, reject) => {
    // Using navigator.mediaDevices.getUserMedia to request microphone access
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        // Permission granted, handle the stream if needed
        console.log("Microphone access granted");

        // Stop the tracks to prevent the recording indicator from being shown
        stream.getTracks().forEach(function (track) {
          track.stop();
        });

        resolve();
      })
      .catch((error) => {
        console.error("Error requesting microphone permission", error);

        try {
          chrome.runtime.sendMessage({ action: "requestPermissionsError", data: { error: error } });
        } catch (error) {
          console.error("Error sending message to current window: ", error);
        }

        try {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "requestPermissionsError", data: { error: error } });
          });
        } catch (error) {
          console.error("Error sending message to active tab: ", error);
        }

        reject(error);
      });
  });
}

// Call the function to request microphone permission
getUserPermission();
