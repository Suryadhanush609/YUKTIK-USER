// src/services/speech.js

export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createSpeechRecognition({ onResult, onError, onStart, onEnd }) {
  const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!SpeechRecognition) {
    if (onError) onError(new Error('Web Speech API is not supported in this browser. You can still type your report.'));
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    if (onStart) onStart();
  };

  recognition.onresult = (event) => {
    if (event.results && event.results[0] && event.results[0][0]) {
      const transcript = event.results[0][0].transcript;
      if (onResult) onResult(transcript);
    }
  };

  recognition.onerror = (event) => {
    let message = 'Speech recognition error';
    if (event.error === 'not-allowed') {
      message = 'Microphone permission was denied. Please allow microphone access or type your report.';
    } else if (event.error === 'no-speech') {
      message = 'No speech was detected. Please try speaking again.';
    } else if (event.error) {
      message = `Speech error: ${event.error}`;
    }
    if (onError) onError(new Error(message));
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
}
