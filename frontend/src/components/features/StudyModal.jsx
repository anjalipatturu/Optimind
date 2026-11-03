import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, Check, HelpCircle, RotateCcw, Award, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAppStore } from '../../store/useAppStore';

export default function StudyModal() {
  const { studyModalOpen, setStudyModalOpen, currentChatId } = useAppStore();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('flashcards'); // 'flashcards' | 'quiz' | 'summary'
  const [cardIdx, setCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studyModalOpen) {
      loadStudyData();
    }
  }, [studyModalOpen]);

  const loadStudyData = async () => {
    setLoading(true);
    try {
      const res = await api.generateStudyMaterial({ chat_id: currentChatId });
      setData(res);
      setCardIdx(0);
      setIsFlipped(false);
      setQuizAnswers({});
      setScore(null);
    } catch (err) {
      console.error("Failed to load study material", err);
    } finally {
      setLoading(false);
    }
  };

  if (!studyModalOpen) return null;

  const handleQuizSelect = (qIdx, optIdx) => {
    setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const calculateQuizScore = () => {
    if (!data?.quiz) return;
    let correct = 0;
    data.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.answer_idx) correct += 1;
    });
    setScore(correct);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Study & Mastery Mode
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Turn your conversation into active recall flashcards, quiz, and executive takeaways
                </p>
              </div>
            </div>

            <button
              onClick={() => setStudyModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/30 dark:bg-slate-950/20 gap-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'flashcards' ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-500'
              }`}
            >
              Active Recall Flashcards
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'quiz' ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-500'
              }`}
            >
              Interactive Quiz
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'summary' ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-500'
              }`}
            >
              Key Takeaways
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                <span className="text-sm font-medium">Synthesizing study curriculum...</span>
              </div>
            ) : data && (
              <>
                {/* 1. Flashcards Tab */}
                {activeTab === 'flashcards' && data.flashcards && (
                  <div className="flex flex-col items-center justify-center space-y-6 py-4">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      Card {cardIdx + 1} of {data.flashcards.length} • Tap to Flip
                    </div>

                    <div
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="w-full max-w-lg min-h-[200px] p-8 rounded-3xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 via-slate-50/50 to-transparent dark:bg-slate-950 flex flex-col items-center justify-center text-center shadow-xl cursor-pointer hover:border-cyan-500/60 transition-all select-none"
                    >
                      <span className="text-xs font-bold text-cyan-500 mb-2 uppercase tracking-wider">
                        {isFlipped ? "Answer" : "Question"}
                      </span>
                      <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                        {isFlipped ? data.flashcards[cardIdx].back : data.flashcards[cardIdx].front}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setCardIdx((prev) => (prev > 0 ? prev - 1 : data.flashcards.length - 1));
                          setIsFlipped(false);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Flip
                      </button>
                      <button
                        onClick={() => {
                          setCardIdx((prev) => (prev < data.flashcards.length - 1 ? prev + 1 : 0));
                          setIsFlipped(false);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 shadow-md shadow-cyan-500/20"
                      >
                        Next Card
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Quiz Tab */}
                {activeTab === 'quiz' && data.quiz && (
                  <div className="space-y-6">
                    {data.quiz.map((q, qIdx) => (
                      <div key={qIdx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {qIdx + 1}. {q.question}
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = quizAnswers[qIdx] === optIdx;
                            const isCorrect = score !== null && optIdx === q.answer_idx;
                            const isWrong = score !== null && isSelected && optIdx !== q.answer_idx;

                            let btnStyle = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900";
                            if (isSelected && score === null) btnStyle = "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300";
                            if (isCorrect) btnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold";
                            if (isWrong) btnStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300";

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleQuizSelect(qIdx, optIdx)}
                                className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                              >
                                <span>{opt}</span>
                                {isCorrect && <Check className="w-4 h-4 text-emerald-500" />}
                              </button>
                            );
                          })}
                        </div>
                        {score !== null && (
                          <p className="text-xs text-slate-500 italic pt-1">
                            Explanation: {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={calculateQuizScore}
                        className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-lg shadow-cyan-500/20"
                      >
                        Submit Answers
                      </button>

                      {score !== null && (
                        <div className="flex items-center gap-2 font-bold text-sm text-cyan-500">
                          <Award className="w-5 h-5" />
                          <span>Score: {score} / {data.quiz.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Summary Tab */}
                {activeTab === 'summary' && (
                  <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Session Digest & Key Takeaways</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {data.summary}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

