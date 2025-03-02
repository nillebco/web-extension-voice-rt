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