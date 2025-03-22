import { addExtensionListener, addDocumentListener } from "./polyfill";
import { generateReaderContent } from "./reader";
import {
    startSession,
    sessionUpdate,
    stopSession,
    dataChannelSend,
} from "./voiceRealTime";
import {
    showVoiceSessionLoader,
    showVoiceSessionReady,
    hideVoiceSession,
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

function _toolsDefinitions() {
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
            return { success: false, error: error.message, hint: "Check the error: if there is something that the user can do to fix it, suggest it to the user, then ask her to repeat the action. Otherwise, tell her that a copy of the error has been pasted to the Developer Tools Console." };
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
        hideVoiceSession();
        return { success: true };
    },
};

async function processRealtimeEvent(msg) {
    if (msg.type === 'response.function_call_arguments.done') {
        const fn = fns[msg.name];
        if (fn !== undefined) {
            console.log(`Calling local function ${msg.name} with arguments:`, msg.arguments);
            const args = JSON.parse(msg.arguments);
            const result = await fn(args);
            console.log(`Function ${msg.name} executed successfully with result:`, result);
            // Let OpenAI know that the function has been called and share its output
            const event = {
                type: 'conversation.item.create',
                item: {
                    type: 'function_call_output',
                    call_id: msg.call_id, // call_id from the function_call message
                    output: JSON.stringify(result), // result of the function
                },
            };
            console.log(`Sending function output to AI:`, event);
            dataChannelSend(event);
            dataChannelSend({ type: "response.create" });
        } else {
            console.error(`Function ${msg.name} not found in registered functions. Available functions:`, Object.keys(fns));
        }
    } else if (msg.type === 'response.function_call.start') {
        console.log(`AI is starting a function call: ${msg.name}`);
    }
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
    await sessionUpdate(prompt, _toolsDefinitions());
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
            hideVoiceSession();
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
            processRealtimeEvent(data);
            break;
        case "dataChannelOpen":
            console.log("Content - Data channel is now open");
            showVoiceSessionReady();
            break;
        case "realtimeError":
            console.log("Content - Realtime error:", data);
            hideVoiceSession();
            break;
        case "stopVoiceSession":
            console.log("Content - Stopping voice session");
            stopSession();
            hideVoiceSession();
            break;
    }
});
