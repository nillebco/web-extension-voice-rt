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
    }
});
