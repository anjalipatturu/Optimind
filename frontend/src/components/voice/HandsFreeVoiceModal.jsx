import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Volume2, Sparkles, MessageSquare } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function HandsFreeVoiceModal() {
  const { handsFreeVoiceOpen, setHandsFreeVoiceOpen, currentChatId } = useAppStore();
  const [orbState, setOrbState] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking'
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (handsFreeVoiceOpen) {
      startListening();
    } else {
      stopListening();
    }
  }, [handsFreeVoiceOpen]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setOrbState('listening');
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (event) => {
      const text = Array.from(event.results).map(r => r[0].transcript).join('');
      setTranscript(text);
    };

    rec.onend = () => {
      if (transcript.trim()) {
        handleAiReply(transcript);
      } else {
        setOrbState('idle');
      }
    };

    rec.start();
    recognitionRef.current = rec;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    window.speechSynthesis?.cancel();
    setOrbState('idle');
  };

  const handleAiReply = (userQuery) => {
    setOrbState('thinking');
    setTimeout(() => {
      const reply = `I optimized your intent. Addressing "${userQuery.slice(0, 40)}": Here is your structured, high-clarity solution.`;
      setResponse(reply);
      setOrbState('speaking');

      // Speak aloud
      const utterance = new SpeechSynthesisUtterance(reply);
      utterance.onend = () => {
        setOrbState('idle');
        setTranscript('');
      };
      window.speechSynthesis.speak(utterance);
    }, 1200);
  };

  if (!handsFreeVoiceOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-slate-950/95 backdrop-blur-2xl text-white">
        {/* Top Header */}
        <div className="w-full max-w-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-sm tracking-wide uppercase text-indigo-400">Hands-Free Voice Mode</span>
          </div>
          <button
            onClick={() => setHandsFreeVoiceOpen(false)}
            className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Animated Voice Orb */}
        <div className="flex flex-col items-center justify-center space-y-8 my-auto">
          <div className="relative flex items-center justify-center">
            {/* Pulsing Aura Rings */}
            <motion.div
              animate={{
                scale: orbState === 'listening' ? [1, 1.35, 1] : orbState === 'speaking' ? [1, 1.2, 1] : [1, 1.05, 1],
                opacity: orbState === 'idle' ? 0.2 : 0.6,
              }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-400 blur-3xl"
            />

            {/* Glowing Orb Sphere */}
            <motion.div
              animate={{
                scale: orbState === 'listening' ? 1.15 : 1,
                rotate: 360,
              }}
              transition={{
                scale: { duration: 0.3 },
                rotate: { repeat: Infinity, duration: 12, ease: "linear" }
              }}
              className="w-44 h-44 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 shadow-2xl flex items-center justify-center border-4 border-white/20 cursor-pointer"
              onClick={startListening}
            >
              {orbState === 'listening' ? (
                <Mic className="w-16 h-16 text-white animate-pulse" />
              ) : orbState === 'speaking' ? (
                <Volume2 className="w-16 h-16 text-white animate-bounce" />
              ) : (
                <Sparkles className="w-16 h-16 text-white/80" />
              )}
            </motion.div>
          </div>

          {/* Status Label */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold tracking-tight">
              {orbState === 'listening' && "Listening to you..."}
              {orbState === 'thinking' && "Synthesizing & Optimizing..."}
              {orbState === 'speaking' && "Responding..."}
              {orbState === 'idle' && "Tap the orb or speak to start"}
            </h3>
            {transcript && (
              <p className="text-sm text-slate-300 italic max-w-md px-4">
                "{transcript}"
              </p>
            )}
            {response && (
              <p className="text-sm text-indigo-200 font-medium max-w-md px-4">
                {response}
              </p>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 font-mono">
          Powered by Optimind Web Speech & SpeechSynthesis
        </div>
      </div>
    </AnimatePresence>
  );
}

