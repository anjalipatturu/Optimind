import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';
import {
  Copy, Check, Volume2, VolumeX, ThumbsUp, ThumbsDown,
  RotateCw, Edit2, Sparkles, FileText, CheckCircle2
} from 'lucide-react';
import { api } from '../../lib/api';

export default function MessageBubble({ message, onRegenerate, onEdit }) {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(null); // 'up' | 'down'
  const [feedbackMenuOpen, setFeedbackMenuOpen] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis?.cancel();
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis?.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleFeedback = async (rating, reason = null) => {
    setFeedbackGiven(rating > 0 ? 'up' : 'down');
    setFeedbackMenuOpen(false);
    try {
      await api.submitFeedback({
        message_id: message.id,
        rating: rating,
        reasons: reason ? [reason] : [],
        comment: feedbackComment || null
      });
    } catch (err) {
      console.error("Feedback error", err);
    }
  };

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} my-4 w-full group select-text`}>
      {/* Sender Header */}
      <div className="flex items-center gap-2 mb-1.5 px-1 text-xs font-semibold text-slate-400">
        {!isUser && (
          <div className="flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Optimind AI</span>
          </div>
        )}
        {message.optimization_id && (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold">
            Optimized Prompt
          </span>
        )}
      </div>

      {/* Message Content Bubble */}
      <div
        className={`max-w-[90%] md:max-w-[80%] rounded-3xl p-5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white rounded-br-sm shadow-indigo-500/20'
            : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 rounded-bl-sm shadow-slate-950/5'
        }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap font-sans text-[15px]">{message.content}</div>
        ) : (
          <div className="prose prose-slate dark:prose-invert max-w-none text-[15px] leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <div className="relative group/code my-3">
                      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-950 rounded-t-xl text-[11px] font-mono text-slate-400 border-b border-slate-800">
                        <span>{match[1]}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                          }}
                          className="hover:text-white transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="!mt-0 !rounded-t-none">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-indigo-500" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Attachments chips */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-white/20 dark:border-slate-800">
            {message.attachments.map((att, idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/20 text-xs font-mono">
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px]">{att.filename}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Toolbar on Bottom */}
      {!isUser && (
        <div className="flex items-center gap-2 mt-2 px-1 text-slate-400 text-xs">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Copy answer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* TTS Audio Button */}
          <button
            onClick={handleToggleAudio}
            className={`p-1.5 rounded-lg transition-colors ${
              isPlayingAudio ? 'text-indigo-500 bg-indigo-500/10' : 'hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isPlayingAudio ? "Stop reading" : "Read answer aloud"}
          >
            {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Regenerate Button */}
          {onRegenerate && (
            <button
              onClick={() => onRegenerate(message.id)}
              className="p-1.5 rounded-lg hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Regenerate answer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Thumbs Up feedback */}
          <button
            onClick={() => handleFeedback(1)}
            className={`p-1.5 rounded-lg transition-colors ${
              feedbackGiven === 'up' ? 'text-emerald-500 bg-emerald-500/10' : 'hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Helpful answer"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>

          {/* Thumbs Down feedback */}
          <button
            onClick={() => setFeedbackMenuOpen(!feedbackMenuOpen)}
            className={`p-1.5 rounded-lg transition-colors ${
              feedbackGiven === 'down' ? 'text-rose-500 bg-rose-500/10' : 'hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Unhelpful answer"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>

          {/* Token count */}
          {message.tokens > 0 && (
            <span className="text-[10px] font-mono text-slate-500 ml-2">
              ~{message.tokens} tokens
            </span>
          )}
        </div>
      )}

      {/* Dislike reasons popover */}
      {feedbackMenuOpen && (
        <div className="mt-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-2 text-xs max-w-sm">
          <span className="font-bold text-slate-700 dark:text-slate-300">Why was this unhelpful?</span>
          <div className="flex flex-wrap gap-1.5">
            {["Inaccurate", "Too long", "Too short", "Not what I asked", "Other"].map((reason) => (
              <button
                key={reason}
                onClick={() => handleFeedback(-1, reason)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white transition-colors"
              >
                {reason}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

