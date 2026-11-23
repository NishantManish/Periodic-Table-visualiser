import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Bot,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Award,
  CheckCircle2,
  XCircle,
  Zap,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '../../utils/audio';
import { FormattedChemMarkdown } from '../ui/FormattedChemMarkdown';

export interface QuizPayload {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category?: string;
  selectedOption?: number;
}

export interface TutorMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp?: string;
  model?: string;
  provider?: string;
  latencyMs?: number;
  cached?: boolean;
  quiz?: QuizPayload;
}

interface TutorMessageItemProps {
  message: TutorMessage;
  soundEnabled: boolean;
  onAnswerQuiz?: (messageId: string, optionIdx: number) => void;
  onNextQuiz?: () => void;
}

export const TutorMessageItem: React.FC<TutorMessageItemProps> = ({
  message,
  soundEnabled,
  onAnswerQuiz,
  onNextQuiz,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Copy text to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    playSound('click', soundEnabled);
    setTimeout(() => setCopied(false), 2000);
  };

  // Text to Speech playback
  const handleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner speech
    const cleanSpeechText = message.text
      .replace(/[*#_`~]/g, '')
      .replace(/\[.*?\]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    playSound('click', soundEnabled);
  };

  const isUser = message.sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border ${
          isUser
            ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 border-cyan-400/40 text-white'
            : 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-600 border-purple-400/40 text-white shadow-purple-900/30'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Card Container */}
      <div className={`space-y-2 max-w-2xl min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Header meta */}
        <div className={`flex items-center gap-2 text-[11px] font-mono text-white/50 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="font-bold text-white/70">{isUser ? 'You' : 'AI Chemistry Tutor'}</span>
          <span>•</span>
          <span>{message.timestamp || 'Just now'}</span>
          {!isUser && message.model && (
            <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-purple-300 font-mono flex items-center gap-1 shadow-sm">
              <Zap className="w-2.5 h-2.5 text-amber-400" />
              {message.provider === 'openrouter'
                ? `OpenRouter (${message.model})`
                : message.provider === 'nvidia-nim'
                ? `NVIDIA NIM (${message.model})`
                : message.model}
            </span>
          )}
          {!isUser && message.latencyMs !== undefined && (
            <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-emerald-400 font-mono flex items-center gap-1 shadow-sm">
              <Clock className="w-2.5 h-2.5" />
              {message.cached ? 'Instant (Cache)' : `${message.latencyMs}ms`}
            </span>
          )}
        </div>

        {/* Bubble */}
        <div
          className={`p-4 rounded-3xl shadow-xl transition-all backdrop-blur-md ${
            isUser
              ? 'bg-gradient-to-br from-cyan-600/90 to-blue-600/90 text-white rounded-tr-sm border border-white/20 shadow-cyan-900/20'
              : 'bg-black/40 text-slate-200 border border-white/10 rounded-tl-sm saturate-150'
          }`}
        >
          {isUser ? (
            <p className="text-[13px] leading-relaxed font-medium whitespace-pre-wrap drop-shadow-sm">{message.text}</p>
          ) : (
            <FormattedChemMarkdown text={message.text} variant="dark" />
          )}

          {/* Interactive Quiz Module */}
          {message.quiz && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-3 bg-white/5 -mx-2 -mb-2 p-3.5 rounded-2xl border-x border-b shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-300 flex items-center gap-1.5 drop-shadow-sm">
                  <Award className="w-4 h-4 text-amber-400" />
                  {message.quiz.category || 'Practice Question'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-100 font-mono font-bold border border-purple-500/40 shadow-sm">
                  +25 XP
                </span>
              </div>

              <p className="text-sm font-bold text-white leading-snug drop-shadow-sm">{message.quiz.question}</p>

              {/* Options Grid */}
              <div className="space-y-2 pt-1">
                {message.quiz.options.map((opt, optIdx) => {
                  const isAnswered = message.quiz?.selectedOption !== undefined;
                  const isSelected = message.quiz?.selectedOption === optIdx;
                  const isCorrect = optIdx === message.quiz?.correctIndex;

                  let stateStyles = 'bg-black/20 text-white/80 border-white/10 hover:bg-white/10 hover:border-purple-500/50 shadow-sm';

                  if (isAnswered) {
                    if (isCorrect) {
                      stateStyles = 'bg-emerald-900/60 text-emerald-100 border-emerald-500 shadow-md shadow-emerald-900/40 font-bold';
                    } else if (isSelected && !isCorrect) {
                      stateStyles = 'bg-rose-900/60 text-rose-100 border-rose-500 font-bold shadow-md shadow-rose-900/40';
                    } else {
                      stateStyles = 'bg-black/10 text-white/40 border-white/5 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isAnswered}
                      onClick={() => {
                        if (!isAnswered && onAnswerQuiz) {
                          onAnswerQuiz(message.id, optIdx);
                          if (optIdx === message.quiz?.correctIndex) {
                            playSound('correct', soundEnabled);
                            confetti({
                              particleCount: 30,
                              spread: 60,
                              origin: { y: 0.8 },
                            });
                          } else {
                            playSound('wrong', soundEnabled);
                          }
                        }
                      }}
                      className={`w-full p-3 rounded-2xl border text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer backdrop-blur-md ${stateStyles}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-lg bg-black/40 flex items-center justify-center font-mono text-[10px] text-white/70 font-bold shrink-0 shadow-inner">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        {opt}
                      </span>
                      {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 drop-shadow-sm" />}
                      {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0 drop-shadow-sm" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Card */}
              {message.quiz.selectedOption !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-2xl bg-black/20 border border-white/10 text-[12px] text-white/80 leading-relaxed space-y-2 mt-3 shadow-inner"
                >
                  <div className="font-extrabold text-amber-300 flex items-center gap-1.5 drop-shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Explanation:
                  </div>
                  <p>{message.quiz.explanation}</p>

                  {onNextQuiz && (
                    <button
                      onClick={onNextQuiz}
                      className="mt-2 px-3 py-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer border border-purple-400/30"
                    >
                      Next Practice Question <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions (Copy, TTS) for AI messages */}
        {!isUser && (
          <div className="flex items-center gap-2 pt-0.5 px-1">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-xl bg-black/20 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-sm backdrop-blur-md"
              title="Copy answer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleSpeak}
              className={`p-1.5 rounded-xl border text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-sm backdrop-blur-md ${
                isSpeaking
                  ? 'bg-purple-600/80 text-white border-purple-500/50 shadow-md shadow-purple-600/30'
                  : 'bg-black/20 hover:bg-white/10 text-white/50 hover:text-white border-white/10'
              }`}
              title={isSpeaking ? 'Stop voice' : 'Read aloud'}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isSpeaking ? 'Stop' : 'Read'}</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
