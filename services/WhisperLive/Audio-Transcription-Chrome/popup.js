// Wait for the DOM content to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  const startButton = document.getElementById("startCapture");
  const stopButton = document.getElementById("stopCapture");

  const useServerCheckbox = document.getElementById("useServerCheckbox");
  const useVadCheckbox = document.getElementById("useVadCheckbox");
  const useMicrophoneCheckbox = document.getElementById("useMicrophoneCheckbox");
  const requestMicPermissionBtn = document.getElementById("requestMicPermission");
  const micPermissionStatus = document.getElementById("micPermissionStatus");
  const languageDropdown = document.getElementById('languageDropdown');
  const taskDropdown = document.getElementById('taskDropdown');
  const modelSizeDropdown = document.getElementById('modelSizeDropdown');
  let selectedLanguage = null;
  let selectedTask = taskDropdown.value;
  let selectedModelSize = modelSizeDropdown.value;

  // Add click event listeners to the buttons
  startButton.addEventListener("click", startCapture);
  stopButton.addEventListener("click", stopCapture);
  
  // Check microphone permission status on load
  async function checkMicPermission() {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' });
      if (result.state === 'granted') {
        micPermissionStatus.textContent = "✅ Permission granted";
        micPermissionStatus.style.color = "green";
        requestMicPermissionBtn.disabled = true;
        requestMicPermissionBtn.textContent = "Permission Granted";
      } else if (result.state === 'prompt') {
        micPermissionStatus.textContent = "Click button to request";
        micPermissionStatus.style.color = "#666";
      } else {
        micPermissionStatus.textContent = "Permission denied in browser";
        micPermissionStatus.style.color = "red";
      }
      
      // Listen for permission changes
      result.addEventListener('change', () => {
        if (result.state === 'granted') {
          micPermissionStatus.textContent = "✅ Permission granted";
          micPermissionStatus.style.color = "green";
          requestMicPermissionBtn.disabled = true;
          requestMicPermissionBtn.textContent = "Permission Granted";
        }
      });
    } catch (error) {
      console.warn("Could not check microphone permission:", error);
      micPermissionStatus.textContent = "Click button to request";
    }
  }
  
  checkMicPermission();
  
  // Request microphone permission
  requestMicPermissionBtn.addEventListener("click", async () => {
    try {
      micPermissionStatus.textContent = "Opening permission page...";
      micPermissionStatus.style.color = "#666";
      
      // Send message to background to open options page for permission request
      chrome.runtime.sendMessage({ 
        action: "requestMicrophonePermission" 
      }, (response) => {
        if (response && response.success) {
          micPermissionStatus.textContent = "✅ Permission granted!";
          micPermissionStatus.style.color = "green";
          requestMicPermissionBtn.disabled = true;
          requestMicPermissionBtn.textContent = "Permission Granted";
          // Recheck permission after a delay
          setTimeout(checkMicPermission, 500);
        } else {
          micPermissionStatus.textContent = "Please allow microphone in the opened tab";
          micPermissionStatus.style.color = "#ff9800";
        }
      });
    } catch (error) {
      console.error("Microphone permission error:", error);
      micPermissionStatus.textContent = "❌ Error: " + error.message;
      micPermissionStatus.style.color = "red";
    }
  });

  // Retrieve capturing state from storage on popup open
  chrome.storage.local.get("capturingState", ({ capturingState }) => {
    if (capturingState && capturingState.isCapturing) {
      toggleCaptureButtons(true);
    } else {
      toggleCaptureButtons(false);
    }
  });

  // Retrieve checkbox state from storage on popup open
  chrome.storage.local.get("useServerState", ({ useServerState }) => {
    if (useServerState !== undefined) {
      useServerCheckbox.checked = useServerState;
    }
  });

  chrome.storage.local.get("useVadState", ({ useVadState }) => {
    if (useVadState !== undefined) {
      useVadCheckbox.checked = useVadState;
    }
  });

  chrome.storage.local.get("useMicrophoneState", ({ useMicrophoneState }) => {
    if (useMicrophoneState !== undefined) {
      useMicrophoneCheckbox.checked = useMicrophoneState;
    } else {
      useMicrophoneCheckbox.checked = true; // Default to true
    }
  });

  chrome.storage.local.get("selectedLanguage", ({ selectedLanguage: storedLanguage }) => {
    if (storedLanguage !== undefined) {
      languageDropdown.value = storedLanguage;
      selectedLanguage = storedLanguage;
    }
  });

  chrome.storage.local.get("selectedTask", ({ selectedTask: storedTask }) => {
    if (storedTask !== undefined) {
      taskDropdown.value = storedTask;
      selectedTask = storedTask;
    }
  });

  chrome.storage.local.get("selectedModelSize", ({ selectedModelSize: storedModelSize }) => {
    if (storedModelSize !== undefined) {
      modelSizeDropdown.value = storedModelSize;
      selectedModelSize = storedModelSize;
    }
  });

  // Function to handle the start capture button click event
  async function startCapture() {
    // Ignore click if the button is disabled
    if (startButton.disabled) {
      return;
    }

    // Check if microphone is enabled and permission is needed
    if (useMicrophoneCheckbox.checked) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' });
        if (result.state === 'denied' || result.state === 'prompt') {
          // No permission - open permission page and mark that we want to auto-start
          micPermissionStatus.textContent = "Opening permission page...";
          micPermissionStatus.style.color = "#ff9800";
          
          // Store that we want to auto-start after permission
          chrome.storage.local.set({ pendingCaptureStart: true });
          
          chrome.runtime.sendMessage({ 
            action: "requestMicrophonePermission" 
          }, (response) => {
            micPermissionStatus.textContent = "✅ Grant permission in opened tab - capture will start automatically!";
            micPermissionStatus.style.color = "#4CAF50";
          });
          return; // Don't start capture yet
        }
      } catch (error) {
        console.warn("Could not check microphone permission:", error);
        // Continue anyway
      }
    }

    // Get the current active tab
    const currentTab = await getCurrentTab();

    // Send a message to the background script to start capturing
    let host = "localhost";
    let port = "9090";
    const useCollaboraServer = useServerCheckbox.checked;
    if (useCollaboraServer){
      host = "transcription.kurg.org"
      port = "7090"
    }

    chrome.runtime.sendMessage(
      { 
        action: "startCapture", 
        tabId: currentTab.id,
        host: host,
        port: port,
        language: selectedLanguage,
        task: selectedTask,
        modelSize: selectedModelSize,
        useVad: useVadCheckbox.checked,
        useMicrophone: useMicrophoneCheckbox.checked,
      }, () => {
        // Update capturing state in storage and toggle the buttons
        chrome.storage.local.set({ capturingState: { isCapturing: true } }, () => {
          toggleCaptureButtons(true);
        });
      }
    );
  }

  // Function to handle the stop capture button click event
  function stopCapture() {
    // Ignore click if the button is disabled
    if (stopButton.disabled) {
      return;
    }

    // Send a message to the background script to stop capturing
    chrome.runtime.sendMessage({ action: "stopCapture" }, () => {
      // Update capturing state in storage and toggle the buttons
      chrome.storage.local.set({ capturingState: { isCapturing: false } }, () => {
        toggleCaptureButtons(false);
      });
    });
  }

  // Function to get the current active tab
  async function getCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]);
      });
    });
  }

  // Function to toggle the capture buttons based on the capturing state
  function toggleCaptureButtons(isCapturing) {
    startButton.disabled = isCapturing;
    stopButton.disabled = !isCapturing;
    useServerCheckbox.disabled = isCapturing;
    useVadCheckbox.disabled = isCapturing;
    useMicrophoneCheckbox.disabled = isCapturing;
    modelSizeDropdown.disabled = isCapturing;
    languageDropdown.disabled = isCapturing;
    taskDropdown.disabled = isCapturing; 
    startButton.classList.toggle("disabled", isCapturing);
    stopButton.classList.toggle("disabled", !isCapturing);
  }

  // Save the checkbox state when it's toggled
  useServerCheckbox.addEventListener("change", () => {
    const useServerState = useServerCheckbox.checked;
    chrome.storage.local.set({ useServerState });
  });

  useVadCheckbox.addEventListener("change", () => {
    const useVadState = useVadCheckbox.checked;
    chrome.storage.local.set({ useVadState });
  });

  useMicrophoneCheckbox.addEventListener("change", () => {
    const useMicrophoneState = useMicrophoneCheckbox.checked;
    chrome.storage.local.set({ useMicrophoneState });
  });

  languageDropdown.addEventListener('change', function() {
    if (languageDropdown.value === "") {
      selectedLanguage = null;
    } else {
      selectedLanguage = languageDropdown.value;
    }
    chrome.storage.local.set({ selectedLanguage });
  });

  taskDropdown.addEventListener('change', function() {
    selectedTask = taskDropdown.value;
    chrome.storage.local.set({ selectedTask });
  });

  modelSizeDropdown.addEventListener('change', function() {
    selectedModelSize = modelSizeDropdown.value;
    chrome.storage.local.set({ selectedModelSize });
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateSelectedLanguage") {
      const detectedLanguage = request.detectedLanguage;
  
      if (detectedLanguage) {
        languageDropdown.value = detectedLanguage;
        chrome.storage.local.set({ selectedLanguage: detectedLanguage }, () => {
          sendResponse({success: true});
        });
        return true; // Required for async sendResponse
      }
    }
    return false;
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleCaptureButtons") {
      toggleCaptureButtons(false);
      chrome.storage.local.set({ capturingState: { isCapturing: false } }, () => {
        sendResponse({success: true});
      });
      return true; // Required for async sendResponse
    } else if (request.action === "microphonePermissionGrantedNotification") {
      // Microphone permission was granted - check if we should auto-start capture
      checkMicPermission(); // Update UI
      
      chrome.storage.local.get("pendingCaptureStart", ({ pendingCaptureStart }) => {
        if (pendingCaptureStart) {
          chrome.storage.local.remove("pendingCaptureStart");
          micPermissionStatus.textContent = "✅ Permission granted! Starting capture...";
          micPermissionStatus.style.color = "green";
          
          // Auto-start capture after a short delay
          setTimeout(() => {
            startCapture();
          }, 1000);
        }
      });
      
      sendResponse({success: true});
      return true;
    }
    return false;
  });
  
});
