import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Send, Paperclip, StopCircle, SlidersHorizontal,
  Bot, Zap, Cpu, FileText, Image as ImageIcon, X, ChevronDown, Check
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { api, getAuthToken } from '../../lib/api';
import MessageBubble from './MessageBubble';
import LiveCoachChip from './LiveCoachChip';
import PromptSliders from './PromptSliders';
import VoiceWaveform from '../voice/VoiceWaveform';
import MagicRewriteToolbar from './MagicRewriteToolbar';

export default function ChatArea() {
  const {
    user,
    currentChatId,
    chats,
    messages,
    setCurrentChat,
    createNewChat,
    setOptimizerModalOpen,
    inputDraft,
    setInputDraft,
    toneSlider,
    detailSlider,
    expertiseSlider,
    refreshStreak
  } = useAppStore();

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [slidersOpen, setSlidersOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Magic rewrite on selection state
  const [selectionRange, setSelectionRange] = useState(null);
  const [selectedText, setSelectedText] = useState('');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);

  const currentChat = chats.find(c => c.id === currentChatId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Handle textarea text selection for Magic Rewrite
  const handleSelectText = () => {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value.substring(el.selectionStart, el.selectionEnd).trim();
    if (text.length > 3) {
      const rect = el.getBoundingClientRect();
      setSelectedText(text);
      setSelectionRange({
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
        start: el.selectionStart,
        end: el.selectionEnd
      });
    } else {
      setSelectedText('');
      setSelectionRange(null);
    }
  };

  const handleReplaceSelectedText = (newText) => {
    if (!selectionRange) return;
    const before = inputDraft.substring(0, selectionRange.start);
    const after = inputDraft.substring(selectionRange.end);
    setInputDraft(before + newText + after);
    setSelectedText('');
    setSelectionRange(null);
  };

  // Flagship Optimize Prompt Trigger
  const handleTriggerOptimizer = async () => {
    if (!inputDraft.trim()) return;
    try {
      const res = await api.optimizePrompt({
        prompt: inputDraft,
        mode: 'Balanced',
        tone_slider: toneSlider,
        detail_slider: detailSlider,
        expertise_slider: expertiseSlider
      });
      setOptimizerModalOpen(true, res);
    } catch (err) {
      console.error("Optimization failed", err);
    }
  };

  // Send Message with SSE streaming
  const handleSendMessage = async () => {
    const text = inputDraft.trim();
    if (!text || isStreaming) return;

    let targetChatId = currentChatId;
    if (!targetChatId) {
      const newChat = await createNewChat(text.slice(0, 30), selectedModel);
      targetChatId = newChat.id;
    }

    const payload = {
      content: text,
      model: selectedModel,
      attachments: attachments
    };

    setInputDraft('');
    setAttachments([]);
    setIsStreaming(true);
    setStreamingContent('');

    // Pre-insert user message locally
    useAppStore.setState(state => ({
      messages: [
        ...state.messages,
        {
          id: 'temp-' + Date.now(),
          chat_id: targetChatId,
          role: 'user',
          content: text,
          attachments: payload.attachments,
          created_at: new Date().toISOString()
        }
      ]
    }));

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/v1/chats/${targetChatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;
            try {
              const event = JSON.parse(dataStr);
              if (event.type === 'token') {
                accumulated += event.token;
                setStreamingContent(accumulated);
              } else if (event.type === 'done') {
                // Finalize assistant message
                useAppStore.setState(state => ({
                  messages: [
                    ...state.messages,
                    {
                      id: event.message_id,
                      chat_id: targetChatId,
                      role: 'assistant',
                      content: event.full_content,
                      created_at: new Date().toISOString()
                    }
                  ]
                }));
                setStreamingContent('');
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error("Streaming error", err);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      await refreshStreak();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (currentChatId) formData.append('chat_id', currentChatId);

    try {
      const res = await api.uploadFile(formData);
      setAttachments(prev => [...prev, res]);
    } catch (err) {
      alert("File upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white dark:bg-[#090d16] relative select-text">
      {/* Top Navbar */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10 select-none">
        <div className="flex items-center gap-3">
          <h1 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 truncate max-w-xs md:max-w-md">
            {currentChat?.title || "New Chat"}
          </h1>
        </div>

        {/* Model selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setSelectedModel('gemini-1.5-flash')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedModel === 'gemini-1.5-flash'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
              Fast
            </button>
            <button
              onClick={() => setSelectedModel('gemini-1.5-pro')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedModel === 'gemini-1.5-pro'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Bot className="w-3.5 h-3.5 inline mr-1 text-indigo-500" />
              Balanced
            </button>
            <button
              onClick={() => setSelectedModel('claude-3-7-sonnet')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedModel === 'claude-3-7-sonnet'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 inline mr-1 text-purple-500" />
              Powerful
            </button>
          </div>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            /* Welcome Landing Screen */
            <div className="py-16 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25">
                <Sparkles className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  Welcome to Optimind, {user?.name || "Explorer"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Every prompt you write can be optimized. Every optimization learns from your feedback to become your ideal co-pilot.
                </p>
              </div>

              {/* Persona suggestion starter cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-4 text-left">
                {[
                  { title: "Architect Scalable System", desc: "Design a fault-tolerant async microservice pipeline", icon: "⚡" },
                  { title: "Feynman Concept Breakdown", desc: "Explain complex distributed consensus to a beginner", icon: "💡" },
                  { title: "High-Conversion Copy", desc: "Write PAS-framework hero copy for a SaaS product", icon: "✍️" },
                  { title: "Rigorous Literature Audit", desc: "Formulate a systematic review with counter-arguments", icon: "🔬" }
                ].map((card, idx) => (
                  <div
                    key={idx}
                    onClick={() => setInputDraft(card.desc)}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 transition-all cursor-pointer shadow-sm group"
                  >
                    <span className="text-xl mb-2 block">{card.icon}</span>
                    <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-indigo-500 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}

              {/* Streaming token bubble */}
              {isStreaming && streamingContent && (
                <div className="flex flex-col items-start my-4 w-full">
                  <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-indigo-500">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Optimind Thinking & Streaming...</span>
                  </div>
                  <div className="max-w-[80%] rounded-3xl rounded-bl-sm p-5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-sm whitespace-pre-wrap">
                    {streamingContent}
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Magic Rewrite Toolbar (on text selection) */}
      <MagicRewriteToolbar
        selectedText={selectedText}
        position={selectionRange}
        onReplace={handleReplaceSelectedText}
        onClose={() => setSelectionRange(null)}
      />

      {/* Bottom Input Area */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#090d16] dark:via-[#090d16]/95 dark:to-transparent z-20">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Live Prompt Coach chip */}
          <LiveCoachChip />

          {/* Adaptive Sliders Drawer */}
          <PromptSliders isOpen={slidersOpen} onClose={() => setSlidersOpen(false)} />

          {/* Attachment Chips Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1">
              {attachments.map((att, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="truncate max-w-xs">{att.filename}</span>
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="p-0.5 hover:text-rose-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Box Container */}
          <div className="relative flex flex-col rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl focus-within:border-indigo-500 transition-all">
            <textarea
              ref={textareaRef}
              value={inputDraft}
              onChange={(e) => setInputDraft(e.target.value)}
              onSelect={handleSelectText}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything, or type a draft and tap ✨ to optimize..."
              className="w-full p-4 pb-14 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none max-h-40"
              rows={2}
            />

            {/* Bottom Controls Bar inside Input Box */}
            <div className="absolute bottom-3 inset-x-4 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                {/* File Attachment */}
                <label className="p-2 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors" title="Attach file or photo (PDF, DOCX, CSV, PNG, JPG)">
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                  <Paperclip className="w-4 h-4" />
                </label>

                {/* Adaptive Sliders Button */}
                <button
                  type="button"
                  onClick={() => setSlidersOpen(!slidersOpen)}
                  className={`p-2 rounded-xl transition-colors ${slidersOpen ? 'text-indigo-500 bg-indigo-500/10' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  title="Tone & Depth Sliders"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>

                {/* Voice to text waveform */}
                <VoiceWaveform
                  onTranscript={(txt) => setInputDraft(prev => prev + ' ' + txt)}
                  isRecording={isRecording}
                  setIsRecording={setIsRecording}
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Flagship Optimizer Button (Sparkles) */}
                <button
                  type="button"
                  onClick={handleTriggerOptimizer}
                  disabled={!inputDraft.trim()}
                  className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/25 hover:opacity-95 disabled:opacity-40 transition-all"
                  title="Optimize prompt with self-evolving AI"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Optimize</span>
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!inputDraft.trim() || isStreaming}
                  className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/25 disabled:opacity-40 transition-all"
                  title="Send prompt"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

