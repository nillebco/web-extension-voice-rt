const injectMicrophonePermissionIframe = () => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("hidden", "hidden");
    iframe.setAttribute("id", "permissionsIFrame");
    iframe.setAttribute("allow", "microphone");
    iframe.src = chrome.runtime.getURL("permissions.html");
    document.body.appendChild(iframe);
};

const injectReaderContentIframe = (article) => {
    document.body.innerHTML = article.content;
};

// Create and inject voice session status indicator
const createVoiceStatusIndicator = () => {
    // Remove any existing indicator first
    const existingIndicator = document.getElementById('voice-status-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    const indicator = document.createElement('div');
    indicator.id = 'voice-status-indicator';
    indicator.style.position = 'fixed';
    indicator.style.bottom = '20px';
    indicator.style.right = '20px';
    indicator.style.padding = '10px 15px';
    indicator.style.borderRadius = '5px';
    indicator.style.zIndex = '9999';
    indicator.style.fontFamily = 'Arial, sans-serif';
    indicator.style.fontSize = '14px';
    indicator.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    
    return indicator;
};

const showVoiceSessionLoader = () => {
    const indicator = createVoiceStatusIndicator();
    indicator.textContent = 'Connecting voice assistant...';
    indicator.style.backgroundColor = '#f8f9fa';
    indicator.style.color = '#333';
    indicator.style.border = '1px solid #ddd';
    document.body.appendChild(indicator);
};

const showVoiceSessionReady = () => {
    const indicator = document.getElementById('voice-status-indicator');
    if (indicator) {
        indicator.textContent = 'Voice assistant ready';
        indicator.style.backgroundColor = '#e6f7e6';
        indicator.style.color = '#2e7d32';
        indicator.style.border = '1px solid #c8e6c9';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            indicator.style.opacity = '0';
            indicator.style.transition = 'opacity 0.5s ease';
            setTimeout(() => indicator.remove(), 500);
        }, 5000);
    }
};

const hideVoiceSession = () => {
    const indicator = document.getElementById('voice-status-indicator');
    if (indicator) {
        indicator.style.opacity = '0';
        indicator.style.transition = 'opacity 0.5s ease';
        setTimeout(() => indicator.remove(), 500);
    }
}

// allow microphone permission via a menu like
// brave://settings/content/siteDetails?site=chrome-extension%3A%2F%2Fajknliokcllkolhdgjdbndfpchlofial%2F
injectMicrophonePermissionIframe();

async function showReader() {
    console.log("Showing reader");
    const article = await generateReaderContent();
    injectReaderContentIframe(article);
}

async function startVoiceSession() {
    console.log("Starting voice session");
    showVoiceSessionLoader();
    const article = await generateReaderContent();
    console.log("Article generated", article);
    const context = article.title + " " + article.textContent;
    const prompt = "You are an accessibility assistant. You are helping the end user to understand the content of a page, answering questions, reading a summary." +
        "The language of the article might differ from the language of the user - please answer in thelanguage of the user. The content of the article follows;" +
        context
    await startSession();
    await sessionUpdate(prompt);
}

addListener(async (message, sender, sendResponse) => {
    // Log the message source for debugging
    console.log("Message received from:", sender.id);
    
    switch (message.action) {
        case "generateReaderContent":
            showReader();
            break;
        case "startVoiceSession":
            startVoiceSession();
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
        case "dataChannelOpen":
            console.log("Content - Data channel is now open");
            showVoiceSessionReady();
            break;
    }
});
