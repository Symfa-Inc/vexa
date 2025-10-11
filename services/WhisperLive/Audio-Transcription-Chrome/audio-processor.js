// AudioWorklet processor for capturing and resampling audio
class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.isServerReady = false;
    this.frameCount = 0;
    
    // Listen for messages from main thread
    this.port.onmessage = (event) => {
      if (event.data.type === 'serverReady') {
        this.isServerReady = event.data.value;
        console.log('AudioWorklet: Server ready received, isServerReady =', this.isServerReady);
      }
    };
    
    console.log('AudioWorklet: AudioCaptureProcessor constructed');
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (input && input.length > 0) {
      const channelData = input[0]; // First channel
      
      if (channelData && channelData.length > 0) {
        // Log first few frames
        if (this.frameCount < 3) {
          console.log(`AudioWorklet: Frame ${this.frameCount}, length=${channelData.length}, isServerReady=${this.isServerReady}`);
          this.frameCount++;
        }
        
        // Always send data regardless of server ready state
        // The main thread will handle filtering
        // Copy the data to prevent it from being modified
        const dataCopy = new Float32Array(channelData);
        this.port.postMessage({
          type: 'audioData',
          data: dataCopy,
          sampleRate: sampleRate
        });
      }
    }
    
    // Return true to keep processor alive
    return true;
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);

