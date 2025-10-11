const statusDiv = document.getElementById('status');
const requestBtn = document.getElementById('requestBtn');

// Auto-request on page load
window.addEventListener('DOMContentLoaded', () => {
    // Small delay to let the page render
    setTimeout(requestMicrophone, 500);
});

requestBtn.addEventListener('click', requestMicrophone);

async function requestMicrophone() {
    try {
        statusDiv.textContent = 'Requesting microphone access...';
        statusDiv.className = '';
        requestBtn.disabled = true;
        
        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Success! Stop the stream immediately
        stream.getTracks().forEach(track => track.stop());
        
        statusDiv.textContent = '✅ Permission granted! This tab will close automatically...';
        statusDiv.className = 'success';
        
        // Notify background that permission was granted
        chrome.runtime.sendMessage({ 
            action: "microphonePermissionGranted" 
        });
        
        // Close this tab after a short delay
        setTimeout(() => {
            window.close();
        }, 1500);
        
    } catch (error) {
        console.error('Microphone permission error:', error);
        statusDiv.textContent = `❌ Permission denied: ${error.message}\n\nPlease click the button again and allow microphone access.`;
        statusDiv.className = 'error';
        requestBtn.disabled = false;
        requestBtn.textContent = 'Try Again';
    }
}

