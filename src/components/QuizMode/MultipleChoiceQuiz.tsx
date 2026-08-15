import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { QuizQuestion } from '../../types';
import { ELEMENTS } from '../../data/elementsData';
import { useAppStore } from '../../store/useAppStore';
import {
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  RefreshCw,
  BookOpen,
  GraduationCap,
} from 'lucide-react';

const TOPICS = [
  'Periodic Table & Trends',
  'Alkali & Alkaline Earth Metals',
  'Transition Metals & Catalysts',
  'Noble Gases & Halogens',
  'Electron Configuration & Valence',
  'Electronegativity & Ionization',
];

export const MultipleChoiceQuiz: React.FC = () => {
  const { addXp, unlockAchievement, gradeLevel } = useAppStore();

  const [selectedTopic, setSelectedTopic] = useState<string>(TOPICS[0]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // Generate fallback local quiz
  const generateFallbackQuiz = () => {
    const generated: QuizQuestion[] = [];
    for (let i = 0; i < 5; i++) {
      const randomEl = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
      const distractors = ELEMENTS.filter((e) => e.atomicNumber !== randomEl.atomicNumber)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const options = [randomEl.name, ...distractors.map((d) => d.name)].sort(() => 0.5 - Math.random());
      const correctIdx = options.indexOf(randomEl.name);

      generated.push({
        id: `local-q-${i}`,
        question: `Which element has the chemical symbol "${randomEl.symbol}" and atomic number Z=${randomEl.atomicNumber}?`,
        options,
        correctIndex: correctIdx,
        explanation: `${randomEl.name} (${randomEl.symbol}) has Z=${randomEl.atomicNumber}, atomic mass ${randomEl.atomicMass.toFixed(2)} u, and belongs to the ${randomEl.category} group.`,
        category: 'Element Identification',
      });
    }
    setQuestions(generated);
  };

  const handleGenerateQuiz = async () => {
    setLoading(true);
    setQuizFinished(false);
    setCurrentQIdx(0);
    setScore(0);
    setSelectedOption(null);

    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          difficulty: gradeLevel,
          count: 5,
        }),
      });

      const data = await res.json();
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        generateFallbackQuiz();
      }
    } catch (err) {
      generateFallbackQuiz();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerateQuiz();
  }, [selectedTopic, gradeLevel]);

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null || !questions[currentQIdx]) return;
    setSelectedOption(idx);

    if (idx === questions[currentQIdx].correctIndex) {
      setScore((prev) => prev + 1);
      addXp(20);
    }
  };

  const handleNextQuestion = () => {
    if (currentQIdx + 1 < questions.length) {
      setCurrentQIdx((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setQuizFinished(true);
      if (score >= Math.floor(questions.length * 0.8)) {
        unlockAchievement('quiz_master');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Top Filter Bar */}
      <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-slate-400">Topic:</span>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="bg-slate-950 text-purple-300 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none cursor-pointer"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerateQuiz}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-all cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Refresh AI Quiz
        </button>
      </div>

      {/* Main Quiz Area */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-7 space-y-6 shadow-2xl">
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
            <p className="text-xs text-slate-400">Generating AI Chemistry Questions for {gradeLevel}...</p>
          </div>
        ) : quizFinished ? (
          <div className="text-center py-8 space-y-4">
            <Award className="w-16 h-16 text-amber-400 mx-auto" />
            <h3 className="text-2xl font-black text-white">Quiz Complete!</h3>
            <p className="text-lg font-bold text-purple-300 font-mono">
              Score: {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
            </p>
            <button
              onClick={handleGenerateQuiz}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Start Another Quiz
            </button>
          </div>
        ) : questions.length > 0 ? (
          <div className="space-y-6">
            
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold border-b border-slate-800 pb-3">
              <span>Question {currentQIdx + 1} of {questions.length}</span>
              <span className="text-purple-300 font-mono">Score: {score}</span>
            </div>

            <h3 className="text-base font-extrabold text-white leading-snug">
              {questions[currentQIdx].question}
            </h3>

            <div className="space-y-2.5">
              {questions[currentQIdx].options.map((opt, idx) => {
                const isCorrect = idx === questions[currentQIdx].correctIndex;
                const isSelected = selectedOption === idx;

                let style = 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-800';
                if (selectedOption !== null) {
                  if (isCorrect) style = 'bg-emerald-950/80 text-emerald-300 border-emerald-500 font-bold shadow-lg shadow-emerald-500/20';
                  else if (isSelected) style = 'bg-rose-950/80 text-rose-300 border-rose-500 font-bold';
                  else style = 'bg-slate-950/40 text-slate-600 border-slate-800';
                }

                return (
                  <button
                    key={idx}
                    disabled={selectedOption !== null}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-4 rounded-2xl border text-xs text-left transition-all flex items-center justify-between cursor-pointer ${style}`}
                  >
                    <span>{opt}</span>
                    {selectedOption !== null && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                    {selectedOption !== null && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {selectedOption !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-2"
              >
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-purple-400 block mb-1">💡 Explanation:</strong>
                  {questions[currentQIdx].explanation}
                </div>

                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  Next Question →
                </button>
              </motion.div>
            )}

          </div>
        ) : null}
      </div>

    </div>
  );
};
