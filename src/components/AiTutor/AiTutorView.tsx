import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  GraduationCap,
  RefreshCw,
  Scale,
  HelpCircle,
  Brain,
  Lightbulb,
  BookOpen,
  CheckCircle2,
  XCircle,
  Atom,
  Zap,
  ArrowRight,
  ChevronDown,
  Layers,
  Award,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ELEMENTS } from '../../data/elementsData';
import { ElementData, GradeLevel } from '../../types';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    selectedOption?: number;
  };
}

const GRADE_LEVELS: GradeLevel[] = [
  'Grade 5',
  'Grade 8',
  'Grade 10',
  'CBSE/ICSE',
  'JEE/NEET',
  'University',
];

export const AiTutorView: React.FC = () => {
  const {
    selectedElement,
    setSelectedElement,
    gradeLevel,
    setGradeLevel,
    unlockAchievement,
    addXp,
  } = useAppStore();

  // Selected Elements for Comparison Context
  const [element1, setElement1] = useState<ElementData>(selectedElement || ELEMENTS[0]); // Default H
  const [element2, setElement2] = useState<ElementData>(ELEMENTS[1]); // Default He

  // Active AI Mode Tab: 'ask' | 'explain-element' | 'compare' | 'quiz' | 'mnemonic'
  const [activeMode, setActiveMode] = useState<'ask' | 'explain-element' | 'compare' | 'quiz' | 'mnemonic'>('ask');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: `Hello! I am your AI Chemistry Tutor calibrated for **${gradeLevel}**.
      
I remember your active element context (**${
        selectedElement ? `${selectedElement.name} (${selectedElement.symbol})` : 'Hydrogen (H)'
      }**). Ask me anything, generate custom quizzes, compare elements, or simplify complex quantum chemistry concepts!`,
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync selected element from global store when user changes element elsewhere
  useEffect(() => {
    if (selectedElement) {
      setElement1(selectedElement);
    }
  }, [selectedElement]);

  // Send request to Gemini server route
  const handleSendMessage = async (customPrompt?: string, modeOverride?: string) => {
    const query = customPrompt || input;
    if (!query.trim() || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMsgs: Message[] = [
      ...messages,
      { id: userMsgId, sender: 'user', text: query },
    ];

    setMessages(newMsgs);
    if (!customPrompt) setInput('');
    setLoading(true);
    unlockAchievement('ai_convo');

    try {
      const mode = modeOverride || activeMode;

      if (mode === 'quiz') {
        // Special Quiz Generation Endpoint
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
              text: `Here is a custom quiz question on **${query}** (${gradeLevel} level):`,
              quiz: {
                question: quizObj.question,
                options: quizObj.options,
                correctIndex: quizObj.correctIndex,
                explanation: quizObj.explanation,
              },
            },
          ]);
        } else {
          setMessages([
            ...newMsgs,
            {
              id: `ai-${Date.now()}`,
              sender: 'ai',
              text: 'Unable to parse quiz payload. Here is a review topic instead.',
            },
          ]);
        }
      } else {
        // Standard Explanation / Q&A Route
        const res = await fetch('/api/ai/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: query,
            gradeLevel,
            mode: mode === 'mnemonic' ? 'mnemonic' : mode === 'compare' ? 'comparison' : 'normal',
          }),
        });

        const data = await res.json();
        setMessages([
          ...newMsgs,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: data.result || 'No response generated from AI engine.',
          },
        ]);
      }
    } catch (err) {
      setMessages([
        ...newMsgs,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: 'Connection error: Unable to communicate with the Gemini AI service.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Quick Action Handler for Element 1
  const handleQuickElementAction = (actionType: 'explain' | 'simplify' | 'quiz' | 'mnemonic') => {
    const el = element1;
    if (actionType === 'explain') {
      handleSendMessage(
        `Provide a comprehensive explanation of ${el.name} (${el.symbol}, Z=${el.atomicNumber}). Cover its electron configuration ${el.electronConfiguration}, category ${el.category}, physical properties, and key real-world uses.`,
        'explain-element'
      );
    } else if (actionType === 'simplify') {
      handleSendMessage(
        `Explain ${el.name} (${el.symbol}) using a fun, intuitive analogy that a beginner can easily understand. Avoid heavy jargon.`,
        'simple'
      );
    } else if (actionType === 'quiz') {
      handleSendMessage(`${el.name} chemistry and properties`, 'quiz');
    } else if (actionType === 'mnemonic') {
      handleSendMessage(
        `Create a clever mnemonic, rhyme, or memory trick to remember the properties, group, or atomic number of ${el.name} (${el.symbol}).`,
        'mnemonic'
      );
    }
  };

  // Compare Two Elements
  const handleCompareElements = () => {
    const prompt = `Compare ${element1.name} (${element1.symbol}, Z=${element1.atomicNumber}) with ${element2.name} (${element2.symbol}, Z=${element2.atomicNumber}). Compare their atomic radius, electronegativity, ionization energy, reactivity, group trends, and industrial applications.`;
    handleSendMessage(prompt, 'compare');
  };

  // Quiz Option Click Handler
  const handleAnswerQuiz = (msgId: string, optionIdx: number) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.quiz && m.quiz.selectedOption === undefined) {
          const isCorrect = optionIdx === m.quiz.correctIndex;
          if (isCorrect) {
            addXp(25);
          }
          return {
            ...m,
            quiz: {
              ...m.quiz,
              selectedOption: optionIdx,
            },
          };
        }
        return m;
      })
    );
  };

  return (
    <div className="max-w-6xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 flex flex-col min-h-[680px]">
      
      {/* Top Header & Education Level Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-600/30">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              AI Chemistry Tutor & Lab Assistant
            </h2>
            <p className="text-xs text-slate-400">
              Interactive Gemini AI tutor tailored to your specific education level
            </p>
          </div>
        </div>

        {/* Grade Level Selector */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <GraduationCap className="w-4 h-4 text-purple-400 ml-2" />
          <span className="text-xs font-bold text-slate-400">Level:</span>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
            className="bg-slate-900 text-purple-300 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none cursor-pointer"
          >
            {GRADE_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Element Context Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-950 to-indigo-950/60 p-4 rounded-2xl border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-mono font-black text-sm flex items-center justify-center shadow-md">
            {element1.symbol}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-white">
                {element1.name} (Z={element1.atomicNumber})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                Active Context
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {element1.category} | {element1.electronConfiguration}
            </p>
          </div>
        </div>

        {/* Quick Element Action Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleQuickElementAction('explain')}
            className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 text-xs font-bold border border-purple-500/40 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" /> Explain
          </button>

          <button
            onClick={() => handleQuickElementAction('simplify')}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Lightbulb className="w-3.5 h-3.5" /> Simplify
          </button>

          <button
            onClick={() => handleQuickElementAction('quiz')}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Award className="w-3.5 h-3.5" /> Quiz Me
          </button>

          <button
            onClick={() => handleQuickElementAction('mnemonic')}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" /> Mnemonic
          </button>
        </div>

      </div>

      {/* Mode Toolbar: General Ask | Compare Elements | Quiz Generator */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
        
        <button
          onClick={() => setActiveMode('ask')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeMode === 'ask'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" /> General Q&A
        </button>

        <button
          onClick={() => setActiveMode('compare')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeMode === 'compare'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" /> Compare Elements
        </button>

        <button
          onClick={() => setActiveMode('quiz')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeMode === 'quiz'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Award className="w-4 h-4" /> AI Quiz Generator
        </button>

      </div>

      {/* Mode Sub-Panels */}
      {activeMode === 'compare' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <span className="text-xs font-bold text-slate-400">Element A:</span>
            <select
              value={element1.atomicNumber}
              onChange={(e) => {
                const el = ELEMENTS.find((x) => x.atomicNumber === parseInt(e.target.value));
                if (el) {
                  setElement1(el);
                  setSelectedElement(el);
                }
              }}
              className="bg-slate-900 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl border border-slate-800 flex-1 focus:outline-none"
            >
              {ELEMENTS.map((el) => (
                <option key={el.atomicNumber} value={el.atomicNumber}>
                  {el.atomicNumber}. {el.name} ({el.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="text-amber-400 font-black text-xs">VS</div>

          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <span className="text-xs font-bold text-slate-400">Element B:</span>
            <select
              value={element2.atomicNumber}
              onChange={(e) => {
                const el = ELEMENTS.find((x) => x.atomicNumber === parseInt(e.target.value));
                if (el) setElement2(el);
              }}
              className="bg-slate-900 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl border border-slate-800 flex-1 focus:outline-none"
            >
              {ELEMENTS.map((el) => (
                <option key={el.atomicNumber} value={el.atomicNumber}>
                  {el.atomicNumber}. {el.name} ({el.symbol})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCompareElements}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-600/30 transition-all cursor-pointer"
          >
            Compare Side-by-Side
          </button>
        </motion.div>
      )}

      {/* Main Messages Stream Area */}
      <div className="flex-1 overflow-y-auto space-y-4 scrollbar-none pr-2 min-h-[300px]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                m.sender === 'user'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
              }`}
            >
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className="space-y-3 max-w-2xl">
              {/* Message Text Bubble */}
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-md ${
                  m.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-tr-none'
                    : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none font-sans'
                }`}
              >
                {m.text}
              </div>

              {/* Render Interactive Quiz Card if generated by AI */}
              {m.quiz && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between text-xs font-extrabold text-purple-300">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-purple-400" /> AI Practice Question
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">+25 XP</span>
                  </div>

                  <p className="text-xs font-bold text-white">{m.quiz.question}</p>

                  <div className="space-y-2">
                    {m.quiz.options.map((opt, optIdx) => {
                      const isSelected = m.quiz?.selectedOption === optIdx;
                      const isAnswered = m.quiz?.selectedOption !== undefined;
                      const isCorrect = optIdx === m.quiz?.correctIndex;

                      let btnStyle = 'bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-800';
                      if (isAnswered) {
                        if (isCorrect) btnStyle = 'bg-emerald-950/80 text-emerald-300 border-emerald-500';
                        else if (isSelected) btnStyle = 'bg-rose-950/80 text-rose-300 border-rose-500';
                        else btnStyle = 'bg-slate-900/50 text-slate-500 border-slate-800';
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={isAnswered}
                          onClick={() => handleAnswerQuiz(m.id, optIdx)}
                          className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
                        </button>
                      );
                    })}
                  </div>

                  {m.quiz.selectedOption !== undefined && (
                    <p className="text-[11px] text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800 leading-relaxed">
                      💡 <strong>Explanation:</strong> {m.quiz.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              Generating personalized chemistry response for {gradeLevel}...
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompts Pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-2 border-t border-slate-800">
        <span className="text-[10px] uppercase font-extrabold text-slate-400 shrink-0">Prompts:</span>
        {[
          `Why does electronegativity increase across period 3?`,
          `How to balance redox equations using oxidation numbers?`,
          `Explain hybrid orbitals sp, sp2, sp3 with molecular examples`,
          `Create a mnemonic for reactivity series of metals`,
        ].map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-slate-950 hover:bg-purple-950/60 text-slate-300 hover:text-purple-300 border border-slate-800 whitespace-nowrap transition-all cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div className="flex items-center gap-2 pt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={
            activeMode === 'quiz'
              ? 'Enter quiz topic (e.g. Alkali Metals, Periodic Trends, Acid-Base)...'
              : `Ask AI Tutor anything about chemistry at ${gradeLevel} level...`
          }
          className="flex-1 px-4 py-3.5 text-xs rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500 shadow-inner"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !input.trim()}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-xl shadow-purple-600/30 disabled:opacity-50 transition-all cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send
        </button>
      </div>

    </div>
  );
};
