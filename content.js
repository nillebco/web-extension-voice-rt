import { addExtensionListener, addDocumentListener } from "./polyfill";
import { generateReaderContent } from "./reader";
import { 
    startSession, 
    sessionUpdate, 
    stopSession 
} from "./voiceRealTime";
import {
    showVoiceSessionLoader,
    showVoiceSessionReady
} from "./voiceSessionPanel";

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

addExtensionListener(async (message, sender, sendResponse) => {
    console.log("Message received from:", sender.id);
    console.log("Message:", message);

    switch (message.action) {
        case "generateReaderContent":
            console.log("Content - Generating reader content");
            await showReader();
            break;
        case "startVoiceSession":
            console.log("Content - Starting voice session");
            await startVoiceSession();
            break;
        case "stopVoiceSession":
            console.log("Content - Stopping voice session");
            stopSession();
            break;
    }
});

addDocumentListener((event) => {
    const { action, data } = event.detail;
    switch (action) {
        case "realtimeVoiceSessionSetupError":
            console.log("Content - Realtime voice session setup error:", data);
            break;
        case "realtimeEvent":
            console.log("Content - Received realtime event:", data);
            break;
        case "dataChannelOpen":
            console.log("Content - Data channel is now open");
            showVoiceSessionReady();
            break;
    }
});
