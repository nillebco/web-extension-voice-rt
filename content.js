import { addExtensionListener, addDocumentListener } from "./polyfill";
import { generateReaderContent } from "./reader";
import {
    startSession,
    sessionUpdate,
    stopSession,
    processFunctionCalls
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

const _toolsDefinitions = () => {
    return [
        {
            type: 'function',
            name: 'getPageHTML',
            description: 'Gets the HTML for the current page',
        },
        {
            type: 'function',
            name: 'copyToClipboard',
            description: 'Copies the specified text to the clipboard',
            parameters: {
                type: 'object',
                properties: {
                    text: { type: 'string', description: 'The text to copy to the clipboard' },
                },
                required: ['text']
            },
        },
        {
            type: 'function',
            name: 'getCurrentPageUrl',
            description: 'Gets the URL of the current page',
        },
        {
            type: 'function',
            name: 'changeBackgroundColor',
            description: 'Changes the background color of a web page',
            parameters: {
                type: 'object',
                properties: {
                    color: { type: 'string', description: 'A hex value of the color' },
                },
            },
        },
        {
            type: 'function',
            name: 'stopSession',
            description: 'Stops the voice session. Should be called when the user says "stop" or "end" or "quit" or "exit" or "bye" or "goodbye" or "thank you".',
        }
    ]
}

const fns = {
    getPageHTML: () => {
        return { success: true, html: document.documentElement.outerHTML };
    },
    copyToClipboard: async ({ text }) => {
        try {
            await navigator.clipboard.writeText(text);
            return { success: true, message: "Text copied to clipboard" };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    getCurrentPageUrl: () => {
        return { success: true, url: window.location.href };
    },
    changeBackgroundColor: ({ color }) => {
        document.body.style.backgroundColor = color;
        return { success: true, color };
    },
    stopSession: () => {
        stopSession();
        return { success: true };
    },
};

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
    await sessionUpdate(prompt, _toolsDefinitions());
    await processFunctionCalls(fns);
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
        case "stopVoiceSession":
            console.log("Content - Stopping voice session");
            stopSession();
            break;
    }
});
