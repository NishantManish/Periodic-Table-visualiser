import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Sparkles,
  Send,
  Loader2,
  HelpCircle,
  Scale,
  Award,
  BookOpen,
  Lightbulb,
  Zap,
  Layers,
  ArrowRight,
  RefreshCw,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ELEMENTS } from '../../data/elementsData';
import { ElementData, GradeLevel } from '../../types';
import { TutorSidebar } from './TutorSidebar';
import { TutorMessageItem, TutorMessage } from './TutorMessageItem';
import { TutorComparePanel } from './TutorComparePanel';
import { playSound } from '../../utils/audio';

export const AiTutorView: React.FC = () => {
  const {
    selectedElement,
    setSelectedElement,
    gradeLevel,
    setGradeLevel,
    unlockAchievement,
    addXp,
  } = useAppStore();

  // Active elements for tutoring & comparison
  const [element1, setElement1] = useState<ElementData>(selectedElement || ELEMENTS[0]);
  const [element2, setElement2] = useState<ElementData>(ELEMENTS[1]); // Default Helium

  // Active Tab Mode: 'ask' | 'deep-dive' | 'compare' | 'quiz' | 'mnemonic'
  const [activeMode, setActiveMode] = useState<'ask' | 'deep-dive' | 'compare' | 'quiz' | 'mnemonic'>('ask');

  // Sound and Sidebar visibility
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Messages state
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: `👋 **Welcome to your AI Chemistry Tutor!**

I am powered by **NVIDIA NIM** (\`meta/llama-3.2-11b-vision-instruct\`) and calibrated for **${gradeLevel}**.
Active focus: **${element1.name} (${element1.symbol}, Z=${element1.atomicNumber})**.

What would you like to explore today?
* Ask any chemistry question or homework problem
* Request real-world industrial or biochemical uses
* Generate practice quizzes with instant XP scoring
* Create memorable mnemonics for exams and competitions`,
      timestamp: 'Just now',
      provider: 'nvidia-nim',
      model: 'meta/llama-3.2-11b-vision-instruct',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync active element from global store when user selects an element in table or 3D view
  useEffect(() => {
    if (selectedElement) {
      setElement1(selectedElement);
    }
  }, [selectedElement]);

  // Autoscroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Execute API call (NVIDIA NIM single-call exclusively)
  const handleSendMessage = async (customPrompt?: string, modeOverride?: string) => {
    const query = (customPrompt || input).trim();
    if (!query || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: TutorMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    if (!customPrompt) setInput('');
    setLoading(true);
    playSound('whoosh', soundEnabled);
    unlockAchievement('ai_convo');

    const effectiveMode = modeOverride || activeMode;

    try {
      if (effectiveMode === 'quiz') {
        // Fast Quiz Endpoint
        const res = await fetch('/api/ai/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: query,
            difficulty: gradeLevel,
            count: 1,
          }),
        });

        const data = await res.json();
        const quizObj = data.questions?.[0];

        if (quizObj) {
          setMessages([
            ...newMsgs,
            {
              id: `ai-${Date.now()}`,
              sender: 'ai',
              text: `Here is a practice question on **${query}** calibrated for **${gradeLevel}**:`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              provider: data.provider || 'nvidia-nim',
              model: data.model || 'meta/llama-3.2-11b-vision-instruct',
              latencyMs: data.latencyMs,
              cached: data.cached,
              quiz: {
                question: quizObj.question,
                options: quizObj.options,
                correctIndex: quizObj.correctIndex,
                explanation: quizObj.explanation,
                category: quizObj.category || 'Practice Question',
              },
            },
          ]);
        } else {
          setMessages([
            ...newMsgs,
            {
              id: `ai-${Date.now()}`,
              sender: 'ai',
              text: 'Unable to parse custom quiz. Please try a different topic or element!',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } else {
        // Fast Explain Endpoint
        let backendMode = 'normal';
        if (effectiveMode === 'mnemonic') backendMode = 'mnemonic';
        else if (effectiveMode === 'compare') backendMode = 'comparison';
        else if (effectiveMode === 'simple') backendMode = 'simple';

        const res = await fetch('/api/ai/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: query,
            gradeLevel,
            mode: backendMode,
          }),
        });

        const data = await res.json();
        setMessages([
          ...newMsgs,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: data.result || 'No response generated.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            provider: data.provider || 'nvidia-nim',
            model: data.model || 'meta/llama-3.2-11b-vision-instruct',
            latencyMs: data.latencyMs,
            cached: data.cached,
          },
        ]);
      }
    } catch (err: any) {
      setMessages([
        ...newMsgs,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ **Service Notice**: Could not complete request (${err?.message || 'Network issue'}). Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Quick Action Chips for Element 1
  const handleQuickAction = (action: 'explain' | 'simplify' | 'quiz' | 'mnemonic' | 'spectroscopy') => {
    const el = element1;
    if (action === 'explain') {
      handleSendMessage(
        `Provide a concise, high-yield overview of ${el.name} (${el.symbol}, Z=${el.atomicNumber}). Detail its category (${el.category}), electron configuration (${el.electronConfiguration}), reactivity, and top industrial application.`,
        'normal'
      );
    } else if (action === 'simplify') {
      handleSendMessage(
        `Explain the chemical behavior of ${el.name} (${el.symbol}) using a memorable real-world analogy. Avoid complex jargon.`,
        'simple'
      );
    } else if (action === 'quiz') {
      handleSendMessage(`${el.name} properties and periodic trends`, 'quiz');
    } else if (action === 'mnemonic') {
      handleSendMessage(
        `Create a clever mnemonic or rhyme to remember ${el.name} (${el.symbol}, Group ${el.group || 'N/A'}, Period ${el.period}) and its primary properties.`,
        'mnemonic'
      );
    } else if (action === 'spectroscopy') {
      handleSendMessage(
        `Explain the spectroscopy and emission spectrum of ${el.name} (${el.symbol}). What causes its spectral lines and what flame test color does it produce?`,
        'normal'
      );
    }
  };

  // Compare elements action
  const handleRunComparison = () => {
    const prompt = `Compare ${element1.name} (${element1.symbol}, Z=${element1.atomicNumber}) with ${element2.name} (${element2.symbol}, Z=${element2.atomicNumber}). Compare their atomic radius, electronegativity, ionization energy, chemical reactivity, and key applications side-by-side.`;
    handleSendMessage(prompt, 'compare');
  };

  // Quiz Answer Handler
  const handleAnswerQuiz = (messageId: string, optionIdx: number) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.quiz && msg.quiz.selectedOption === undefined) {
          const isCorrect = optionIdx === msg.quiz.correctIndex;
          if (isCorrect) {
            addXp(25);
          }
          return {
            ...msg,
            quiz: {
              ...msg.quiz,
              selectedOption: optionIdx,
            },
          };
        }
        return msg;
      })
    );
  };

  // Trigger next question on same topic
  const handleNextQuiz = () => {
    handleSendMessage(`${element1.name} periodic trends`, 'quiz');
  };

  // Export Study Notes
  const handleExportNotes = () => {
    const transcript = messages
      .map(
        (m) =>
          `[${m.timestamp || ''}] ${m.sender === 'user' ? 'STUDENT' : 'AI TUTOR'}:\n${m.text}\n`
      )
      .join('\n----------------------------------------\n\n');

    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chemistry-study-notes-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Clear Chat
  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'ai',
        text: `Chat cleared. Ready for your next chemistry topic at **${gradeLevel}** level!`,
        timestamp: 'Just now',
        provider: 'nvidia-nim',
        model: 'meta/llama-3.2-11b-vision-instruct',
      },
    ]);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 min-h-[720px] pb-10">
      {/* Collapsible Left Rail (Sidebar) */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full lg:w-80 shrink-0"
          >
            <TutorSidebar
              activeElement={element1}
              onSelectElement={(el) => {
                setElement1(el);
                setSelectedElement(el);
              }}
              gradeLevel={gradeLevel}
              onGradeLevelChange={setGradeLevel}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              onQuickPrompt={(p, m) => handleSendMessage(p, m)}
              onExportNotes={handleExportNotes}
              onClearChat={handleClearChat}
              providerBadge="NVIDIA NIM"
              modelBadge="Llama 3.2 11B (Ultra-Fast)"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Interactive Stage */}
      <div className="flex-1 flex flex-col bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-3xl saturate-200 min-w-0 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10"></div>
        
        {/* Top App Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 transition-all cursor-pointer shadow-sm"
              title={sidebarOpen ? 'Hide sidebar' : 'Show study deck'}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>

            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 border border-white/10">
              <Brain className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 drop-shadow-sm">
                AI Chemistry Tutor & Lab Assistant
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30 shadow-inner">
                  {gradeLevel}
                </span>
              </h2>
              <p className="text-[11px] text-white/50 font-medium">
                Single-call NVIDIA NIM acceleration • Direct Socratic feedback
              </p>
            </div>
          </div>

          {/* Mode Pill Bar */}
          <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-xl border border-white/10 overflow-x-auto scrollbar-none shadow-inner">
            <button
              onClick={() => {
                setActiveMode('ask');
                playSound('toggle', soundEnabled);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeMode === 'ask'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" /> Ask Tutor
            </button>

            <button
              onClick={() => {
                setActiveMode('compare');
                playSound('toggle', soundEnabled);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeMode === 'compare'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Scale className="w-3.5 h-3.5" /> Compare
            </button>

            <button
              onClick={() => {
                setActiveMode('quiz');
                playSound('toggle', soundEnabled);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeMode === 'quiz'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Quiz
            </button>

            <button
              onClick={() => {
                setActiveMode('mnemonic');
                playSound('toggle', soundEnabled);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeMode === 'mnemonic'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Mnemonic
            </button>
          </div>
        </div>

        {/* Active Element Quick-Action Header */}
        <div className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 my-3 flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase text-white/50">Context:</span>
            <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-200 font-mono text-xs font-bold border border-purple-500/30 shadow-sm">
              {element1.name} ({element1.symbol}, Z={element1.atomicNumber})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleQuickAction('explain')}
              className="px-2.5 py-1.5 rounded-lg bg-black/20 hover:bg-purple-900/40 text-purple-200 border border-white/10 hover:border-purple-500/40 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <BookOpen className="w-3 h-3" /> Overview
            </button>

            <button
              onClick={() => handleQuickAction('simplify')}
              className="px-2.5 py-1.5 rounded-lg bg-black/20 hover:bg-amber-900/40 text-amber-200 border border-white/10 hover:border-amber-500/40 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Lightbulb className="w-3 h-3" /> Simplify
            </button>

            <button
              onClick={() => handleQuickAction('quiz')}
              className="px-2.5 py-1.5 rounded-lg bg-black/20 hover:bg-emerald-900/40 text-emerald-200 border border-white/10 hover:border-emerald-500/40 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Award className="w-3 h-3" /> Quiz
            </button>

            <button
              onClick={() => handleQuickAction('mnemonic')}
              className="px-2.5 py-1.5 rounded-lg bg-black/20 hover:bg-cyan-900/40 text-cyan-200 border border-white/10 hover:border-cyan-500/40 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Zap className="w-3 h-3" /> Mnemonic
            </button>

            <button
              onClick={() => handleQuickAction('spectroscopy')}
              className="px-2.5 py-1.5 rounded-lg bg-black/20 hover:bg-indigo-900/40 text-indigo-200 border border-white/10 hover:border-indigo-500/40 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3 h-3" /> Emission
            </button>
          </div>
        </div>

        {/* Compare Panel Drawer */}
        {activeMode === 'compare' && (
          <TutorComparePanel
            elementA={element1}
            elementB={element2}
            onSelectA={setElement1}
            onSelectB={setElement2}
            onRunComparison={handleRunComparison}
            loading={loading}
          />
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 min-h-[360px] scrollbar-none z-10">
          {messages.map((m) => (
            <TutorMessageItem
              key={m.id}
              message={m}
              soundEnabled={soundEnabled}
              onAnswerQuiz={handleAnswerQuiz}
              onNextQuiz={handleNextQuiz}
            />
          ))}

          {/* Loading Indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg animate-pulse border border-white/20">
                <Brain className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-2.5 shadow-md backdrop-blur-md">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span>Generating response via NVIDIA NIM (Llama 3.2 11B)...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips above input */}
        <div className="pt-3 pb-2 flex items-center gap-2 overflow-x-auto scrollbar-none border-t border-white/10 z-10">
          <span className="text-[10px] uppercase font-black text-white/40 shrink-0">Try:</span>
          {activeMode === 'quiz' && (
            <button
              onClick={() => handleSendMessage("Give me a random, challenging chemistry question")}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 whitespace-nowrap transition-all cursor-pointer shadow-sm font-bold flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3" /> Random Quiz Question
            </button>
          )}
          {(activeMode === 'quiz'
            ? [
                `Transition metals oxidation states`,
                `Noble gases and octet rule`,
                `Periodic radius anomalies`,
                `Electronegativity trend exceptions`,
              ]
            : [
                `Why does Fluorine have the highest electronegativity?`,
                `How to predict molecular geometry using VSEPR?`,
                `Explain the flame test emission colors of Alkali Metals`,
                `Why is Chromium [Ar] 3d5 4s1 an exception to Aufbau?`,
              ]
          ).map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(suggestion)}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-black/20 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 whitespace-nowrap transition-all cursor-pointer shadow-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 pt-1 z-10">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                activeMode === 'quiz'
                  ? 'Enter topic for instant practice quiz (e.g. Alkali Metals, Redox, Orbitals)...'
                  : `Ask AI Tutor anything about chemistry at ${gradeLevel} level...`
              }
              className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-inner backdrop-blur-md"
            />
          </div>

          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:opacity-95 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-xl shadow-purple-600/30 disabled:opacity-40 transition-all cursor-pointer border border-white/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>

      </div>
    </div>
  );
};
