const injectMicrophonePermissionIframe = () => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("hidden", "hidden");
    iframe.setAttribute("id", "permissionsIFrame");
    iframe.setAttribute("allow", "microphone");
    iframe.src = chrome.runtime.getURL("permissions.html");
    document.body.appendChild(iframe);
};

// allow microphone permission via a menu like
// brave://settings/content/siteDetails?site=chrome-extension%3A%2F%2Fajknliokcllkolhdgjdbndfpchlofial%2F
injectMicrophonePermissionIframe();

addListener((message, sender, sendResponse) => {
    // Log the message source for debugging
    console.log("Message received from:", sender.id);
    
    switch (message.action) {
        case "startVoiceSession":
            startSession();
            break;
        case "stopVoiceSession":
            stopSession();
            break;
        case "recognitionStarted":
            console.log("Content - Recognition started");
            break;
        case "recognitionEnded":
            console.log("Content - Recognition ended");
            break;
        case "recognitionError":
            console.log("Content - Recognition error: ", message.data);
            break;
        case "transcriptionResult":
            console.log("Content - Transcription result: ", message.data);
            break;
        case "realtimeEvent":
            console.log("Content - Received realtime event:", message.data);
            break;
    }
});
