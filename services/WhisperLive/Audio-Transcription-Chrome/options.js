/**
 * Captures audio from the active tab in Google Chrome.
 * @returns {Promise<MediaStream>} A promise that resolves with the captured audio stream.
 */
function captureTabAudio() {
  return new Promise((resolve) => {
    chrome.tabCapture.capture(
      {
        audio: true,
        video: false,
      },
      (stream) => {
        resolve(stream);
      }
    );
  });
}


/**
 * Sends a message to a specific tab in Google Chrome.
 * @param {number} tabId - The ID of the tab to send the message to.
 * @param {any} data - The data to be sent as the message.
 * @returns {Promise<any>} A promise that resolves with the response from the tab.
 */
function sendMessageToTab(tabId, data) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, data, (response) => {
      resolve(response);
    });
  });
}


/**
 * Resamples the audio data to a target sample rate of 16kHz.
 * @param {Array|ArrayBuffer|TypedArray} audioData - The input audio data.
 * @param {number} [origSampleRate=44100] - The original sample rate of the audio data.
 * @returns {Float32Array} The resampled audio data at 16kHz.
 */
function resampleTo16kHZ(audioData, origSampleRate = 44100) {
  // Convert the audio data to a Float32Array
  const data = new Float32Array(audioData);

  // Calculate the desired length of the resampled data
  const targetLength = Math.round(data.length * (16000 / origSampleRate));

  // Create a new Float32Array for the resampled data
  const resampledData = new Float32Array(targetLength);

  // Calculate the spring factor and initialize the first and last values
  const springFactor = (data.length - 1) / (targetLength - 1);
  resampledData[0] = data[0];
  resampledData[targetLength - 1] = data[data.length - 1];

  // Resample the audio data
  for (let i = 1; i < targetLength - 1; i++) {
    const index = i * springFactor;
    const leftIndex = Math.floor(index).toFixed();
    const rightIndex = Math.ceil(index).toFixed();
    const fraction = index - leftIndex;
    resampledData[i] = data[leftIndex] + (data[rightIndex] - data[leftIndex]) * fraction;
  }

  // Return the resampled data
  return resampledData;
}

function generateUUID() {
  let dt = new Date().getTime();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  return uuid;
}


/**
 * Starts recording audio from the captured tab and optionally microphone.
 * @param {Object} option - The options object containing the currentTabId and useMicrophone flag.
 */
async function startRecord(option) {
  const tabStream = await captureTabAudio();
  const uuid = generateUUID();

  if (tabStream) {
    // call when the stream inactive
    tabStream.oninactive = () => {
      window.close();
    };
    
    let combinedStream = tabStream;
    let micStream = null;
    
    // Capture microphone if enabled
    if (option.useMicrophone) {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("✅ Microphone captured successfully");
      } catch (error) {
        console.error("❌ Failed to capture microphone:", error.name, error.message);
        
        // Show user-friendly message
        if (error.name === 'NotAllowedError') {
          console.warn("⚠️ Microphone permission denied. Please:");
          console.warn("   1. Open the extension popup");
          console.warn("   2. Click 'Request Microphone Access' button");
          console.warn("   3. Allow microphone access");
          console.warn("   4. Try Start Capture again");
          console.warn("📝 Continuing with tab audio only...");
        }
        // Continue with tab audio only
      }
    }
    
    // Setup audio processing first
    const audioDataCache = [];
    const context = new AudioContext();
    
    // Load AudioWorklet processor
    const processorUrl = chrome.runtime.getURL('audio-processor.js');
    console.log('Loading AudioWorklet from:', processorUrl);
    try {
      await context.audioWorklet.addModule(processorUrl);
      console.log('AudioWorklet loaded successfully');
    } catch (error) {
      console.error('Failed to load AudioWorklet:', error);
      throw error;
    }
    
    // Create audio sources
    const tabAudioSource = context.createMediaStreamSource(tabStream);
    let micAudioSource = null;
    
    // Create a mixer node for transcription (tab + mic)
    const transcriptionMixerNode = context.createGain();
    transcriptionMixerNode.gain.value = 1.0;
    
    // Connect tab audio to transcription mixer
    tabAudioSource.connect(transcriptionMixerNode);
    console.log('Tab audio connected to mixer');
    
    // Tab audio also goes directly to speakers (for playback)
    tabAudioSource.connect(context.destination);
    console.log('Tab audio connected to speakers');
    
    // Connect microphone to transcription mixer ONLY (not to speakers - avoid feedback)
    if (micStream) {
      micAudioSource = context.createMediaStreamSource(micStream);
      // Microphone goes ONLY to transcription, NOT to speakers
      micAudioSource.connect(transcriptionMixerNode);
      console.log("Microphone connected to transcription mixer only (no feedback to speakers)");
    }
    
    // Create AudioWorkletNode instead of deprecated ScriptProcessorNode
    const audioWorkletNode = new AudioWorkletNode(context, 'audio-capture-processor');
    console.log('AudioWorkletNode created');
    
    // Connect transcription mixer to AudioWorklet for processing
    transcriptionMixerNode.connect(audioWorkletNode);
    console.log('Mixer connected to AudioWorklet');
    
    // Initialize WebSocket and state variables BEFORE setting up callbacks
    const socket = new WebSocket(`ws://${option.host}:${option.port}/`);
    let isServerReady = false;
    let language = option.language;
    let audioFrameCount = 0;
    
    // Handle messages from AudioWorklet
    audioWorkletNode.port.onmessage = (event) => {
      if (event.data.type === 'audioData') {
        audioFrameCount++;
        if (audioFrameCount <= 5) {
          console.log(`Received audio frame #${audioFrameCount} from AudioWorklet, length=${event.data.data.length}, isServerReady=${isServerReady}`);
        }
        
        if (isServerReady) {
          const inputData = event.data.data;
          const audioData16kHz = resampleTo16kHZ(inputData, event.data.sampleRate);
          audioDataCache.push(inputData);
          if (audioFrameCount <= 5) {
            console.log(`✅ Sending audio data to WebSocket, frame #${audioFrameCount}, original length: ${inputData.length}, resampled: ${audioData16kHz.length}, socket readyState: ${socket.readyState}`);
          }
          socket.send(audioData16kHz);
        } else {
          if (audioFrameCount <= 3) {
            console.warn(`⏸️ Server not ready yet, buffering audio frame #${audioFrameCount}`);
          }
        }
      }
    };
    socket.onopen = function(e) { 
      socket.send(
        JSON.stringify({
          uid: uuid,
          language: option.language,
          task: option.task,
          model: option.modelSize,
          use_vad: option.useVad,
          platform: "chrome_extension",
          meeting_url: window.location.href || "chrome_extension",
          token: "chrome_extension_token",
          meeting_id: uuid
        })
      );
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data["uid"] !== uuid)
        return;
      
      if (data["status"] === "WAIT"){
        await sendMessageToTab(option.currentTabId, {
          type: "showWaitPopup",
          data: data["message"],
        });
        chrome.runtime.sendMessage({ action: "toggleCaptureButtons", data: false }, () => {
          if (chrome.runtime.lastError) { /* ignore */ }
        });
        chrome.runtime.sendMessage({ action: "stopCapture" }, () => {
          if (chrome.runtime.lastError) { /* ignore */ }
        });
        return;
      }
        
      if (isServerReady === false){
        isServerReady = true;
        console.log('Server is now ready! Notifying AudioWorklet');
        // Notify AudioWorklet that server is ready
        audioWorkletNode.port.postMessage({ type: 'serverReady', value: true });
        console.log('AudioWorklet notified of server ready state');
        return;
      }
      
      if (language === null) {
        language = data["language"];
        
        // send message to popup.js to update dropdown
        // console.log(language);
        chrome.runtime.sendMessage({
          action: "updateSelectedLanguage",
          detectedLanguage: language,
        }, () => {
          if (chrome.runtime.lastError) { /* ignore */ }
        });

        return;
      }

      if (data["message"] === "DISCONNECT"){
        chrome.runtime.sendMessage({ action: "toggleCaptureButtons", data: false }, () => {
          if (chrome.runtime.lastError) { /* ignore */ }
        });
        return;
      }

      res = await sendMessageToTab(option.currentTabId, {
        type: "transcript",
        data: event.data,
      });
    };

    // Cleanup function when stream ends
    const cleanup = () => {
      if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
      }
      tabStream.getTracks().forEach(track => track.stop());
      if (audioWorkletNode) {
        audioWorkletNode.disconnect();
      }
      if (context) {
        context.close();
      }
    };
    
    tabStream.oninactive = () => {
      cleanup();
      window.close();
    };
  } else {
    window.close();
  }
}

/**
 * Listener for incoming messages from the extension's background script.
 * @param {Object} request - The message request object.
 * @param {Object} sender - The sender object containing information about the message sender.
 * @param {Function} sendResponse - The function to send a response back to the message sender.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { type, data } = request;

  switch (type) {
    case "start_capture":
      startRecord(data);
      break;
    default:
      break;
  }

  sendResponse({});
  return true;
});
