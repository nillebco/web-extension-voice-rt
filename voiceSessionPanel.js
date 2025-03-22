import { sendMessage } from "./polyfill";

// Create and inject voice session status indicator
const createVoiceStatusIndicator = () => {
    // Remove any existing indicator first
    const existingIndicator = document.getElementById('voice-status-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    const indicator = document.createElement('div');
    indicator.id = 'voice-status-indicator';
    
    // Check if device is mobile (not just iOS)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Larger style for mobile devices
        indicator.style.position = 'fixed';
        indicator.style.top = '10%';
        indicator.style.left = '10%';
        indicator.style.width = '80%';
        indicator.style.height = 'auto';
        indicator.style.padding = '20px';
        indicator.style.fontSize = '18px';
    } else {
        // Standard style for other devices
        indicator.style.position = 'fixed';
        indicator.style.bottom = '20px';
        indicator.style.right = '20px';
        indicator.style.padding = '10px 15px';
        indicator.style.fontSize = '14px';
    }
    
    // Common styles
    indicator.style.borderRadius = '5px';
    indicator.style.zIndex = '9999';
    indicator.style.fontFamily = 'Arial, sans-serif';
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
        // Clear previous content
        indicator.innerHTML = '';
        
        // Add status text
        const statusText = document.createElement('div');
        statusText.textContent = 'Voice assistant ready';
        indicator.appendChild(statusText);
        
        // Add stop button
        const stopButton = document.createElement('button');
        stopButton.textContent = 'Stop session';
        stopButton.style.marginTop = '10px';
        stopButton.style.padding = '8px 12px';
        stopButton.style.backgroundColor = '#f44336';
        stopButton.style.color = 'white';
        stopButton.style.border = 'none';
        stopButton.style.borderRadius = '4px';
        stopButton.style.cursor = 'pointer';
        stopButton.onclick = () => {
            sendMessage("stopVoiceSession");
            hideVoiceSession();
        };
        indicator.appendChild(stopButton);
        
        // Style the indicator
        indicator.style.backgroundColor = '#e6f7e6';
        indicator.style.color = '#2e7d32';
        indicator.style.border = '1px solid #c8e6c9';
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

export { createVoiceStatusIndicator, showVoiceSessionLoader, showVoiceSessionReady, hideVoiceSession };