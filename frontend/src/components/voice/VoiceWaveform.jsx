import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function VoiceWaveform({ onTranscript, isRecording, setIsRecording }) {
  const { language } = useAppStore();
  const [seconds, setSeconds] = useState(0);
  const recognitionRef = useRef(null);

  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Web Speech API is not supported in this browser. Please use Chrome/Edge or type your prompt.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : language === 'es' ? 'es-ES' : 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          onTranscript(event.results[i][0].transcript);
        } else {
          interim += event.results[i][0].transcript;
        }
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <div className="flex items-center gap-2">
      {isRecording && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-mono font-bold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span>
          {/* Animated waveform bars */}
          <div className="flex items-center gap-0.5 h-3 ml-1">
            <span className="w-0.5 h-full bg-rose-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-0.5 h-2/3 bg-rose-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-0.5 h-full bg-rose-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="w-0.5 h-1/2 bg-rose-500 animate-bounce" style={{ animationDelay: '450ms' }} />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={toggleRecording}
        className={`p-2 rounded-xl transition-all ${
          isRecording
            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
            : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title={isRecording ? "Stop recording" : "Dictate with voice"}
      >
        {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
      </button>
    </div>
  );
}

