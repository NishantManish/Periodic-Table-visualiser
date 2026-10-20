import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QuizQuestion, GradeLevel } from '../../types';
import { ELEMENTS } from '../../data/elementsData';
import { useAppStore } from '../../store/useAppStore';
import { playSound } from '../../utils/audio';
import {
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  RefreshCw,
  BookOpen,
  GraduationCap,
  Flame,
  Zap,
  ChevronRight,
  Shuffle,
  Cpu,
} from 'lucide-react';

const TOPICS = [
  'Periodic Table & Trends',
  'Alkali & Alkaline Earth Metals',
  'Transition Metals & Catalysts',
  'Noble Gases & Halogens',
  'Electron Configuration & Valence',
  'Electronegativity & Ionization Energy',
  'Nuclear Chemistry & Isotopes',
  'Metalloids & Semiconductors',
  'Lanthanides & Actinides Contraction',
  'Real-World Materials & Chemical Anomalies',
];

const CURRICULA: { label: string; value: GradeLevel }[] = [
  { label: 'Grade 5 (Beginner)', value: 'Grade 5' },
  { label: 'Grade 8 (Middle)', value: 'Grade 8' },
  { label: 'Grade 10 (Secondary)', value: 'Grade 10' },
  { label: 'CBSE / ICSE Board', value: 'CBSE/ICSE' },
  { label: 'JEE / NEET Prep', value: 'JEE/NEET' },
  { label: 'University / Advanced', value: 'University' },
];

export const MultipleChoiceQuiz: React.FC = () => {
  const { addXp, unlockAchievement, gradeLevel, setGradeLevel, soundEnabled } = useAppStore();

  const [selectedTopic, setSelectedTopic] = useState<string>(TOPICS[0]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [aiProvider, setAiProvider] = useState<'nvidia-nim' | 'gemini' | 'dynamic' | null>(null);
  const [archetypeTag, setArchetypeTag] = useState<string>('');

  // Generate curriculum-adjusted fallback local quiz questions (with high entropy randomization)
  const generateFallbackQuiz = useCallback(() => {
    const generated: QuizQuestion[] = [];
    const isElementary = gradeLevel === 'Grade 5' || gradeLevel === 'Grade 8';
    const isAdvanced = gradeLevel === 'JEE/NEET' || gradeLevel === 'University';

    // Pick 5 distinct random elements
    const shuffled = [...ELEMENTS].sort(() => 0.5 - Math.random());
    const sample = shuffled.slice(0, 5);

    sample.forEach((randomEl, i) => {
      const distractors = ELEMENTS.filter((e) => e.atomicNumber !== randomEl.atomicNumber)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      if (isElementary) {
        const qTypes = ['symbol', 'state', 'use', 'period', 'trivia'];
        const qType = qTypes[Math.floor(Math.random() * qTypes.length)];

        if (qType === 'symbol') {
          const options = [randomEl.name, ...distractors.map((d) => d.name)].sort(() => 0.5 - Math.random());
          generated.push({
            id: `elem-q-${Date.now()}-${i}`,
            question: `Which chemical element is represented by the atomic symbol "${randomEl.symbol}"?`,
            options,
            correctIndex: options.indexOf(randomEl.name),
            explanation: `${randomEl.name} (atomic number ${randomEl.atomicNumber}) uses the symbol ${randomEl.symbol}.`,
            category: 'Element Symbol',
          });
        } else if (qType === 'state') {
          const options = ['Solid', 'Liquid', 'Gas', 'Synthetic'].sort(() => 0.5 - Math.random());
          const correctCapital = randomEl.state.charAt(0).toUpperCase() + randomEl.state.slice(1);
          generated.push({
            id: `elem-state-${Date.now()}-${i}`,
            question: `Under standard atmospheric temperature and pressure (STP), what is the physical state of ${randomEl.name}?`,
            options,
            correctIndex: options.indexOf(correctCapital),
            explanation: `At standard room temperature and pressure, ${randomEl.name} (${randomEl.symbol}) exists as a ${randomEl.state}.`,
            category: 'Physical State',
          });
        } else if (qType === 'use') {
          const use = randomEl.uses[Math.floor(Math.random() * randomEl.uses.length)] || 'chemical syntheses';
          const options = [randomEl.name, ...distractors.map((d) => d.name)].sort(() => 0.5 - Math.random());
          generated.push({
            id: `elem-use-${Date.now()}-${i}`,
            question: `Which element is crucial in the application of "${use.toLowerCase()}"?`,
            options,
            correctIndex: options.indexOf(randomEl.name),
            explanation: `${randomEl.name} (${randomEl.symbol}) is widely recognized for its importance in ${use.toLowerCase()}.`,
            category: 'Real-World Uses',
          });
        } else {
          const options = [
            `Period ${randomEl.period}, Group ${randomEl.group}`,
            ...distractors.map((d) => `Period ${d.period}, Group ${d.group}`),
          ].sort(() => 0.5 - Math.random());
          const correctOpt = `Period ${randomEl.period}, Group ${randomEl.group}`;
          generated.push({
            id: `elem-pos-${Date.now()}-${i}`,
            question: `In which Period and Group of the periodic table is ${randomEl.name} (${randomEl.symbol}) located?`,
            options,
            correctIndex: options.indexOf(correctOpt),
            explanation: `${randomEl.name} is in Period ${randomEl.period} and Group ${randomEl.group} (${randomEl.category.replace('-', ' ')}).`,
            category: 'Periodic Grid Position',
          });
        }
      } else if (isAdvanced) {
        const qTypes = ['config', 'en', 'ionization', 'radius', 'density'];
        const qType = qTypes[Math.floor(Math.random() * qTypes.length)];

        if (qType === 'config') {
          const options = [
            randomEl.electronConfiguration,
            ...distractors.map((d) => d.electronConfiguration),
          ].sort(() => 0.5 - Math.random());
          generated.push({
            id: `adv-config-${Date.now()}-${i}`,
            question: `What is the ground-state valence/subshell electron configuration of ${randomEl.name} (Z = ${randomEl.atomicNumber})?`,
            options,
            correctIndex: options.indexOf(randomEl.electronConfiguration),
            explanation: `${randomEl.name} (Z=${randomEl.atomicNumber}) has electron configuration ${randomEl.electronConfiguration} conforming to Aufbau and Hund principles.`,
            category: 'Quantum Chemistry',
          });
        } else if (qType === 'en') {
          const options = [
            `${randomEl.name}: ${randomEl.electronegativity ?? 'N/A'}`,
            ...distractors.map((d) => `${d.name}: ${d.electronegativity ?? 'N/A'}`),
          ].sort(() => 0.5 - Math.random());
          const correctOpt = `${randomEl.name}: ${randomEl.electronegativity ?? 'N/A'}`;
          generated.push({
            id: `adv-en-${Date.now()}-${i}`,
            question: `Which entry correctly pairs ${randomEl.name} (${randomEl.symbol}) with its Pauling electronegativity?`,
            options,
            correctIndex: options.indexOf(correctOpt),
            explanation: `The Pauling electronegativity of ${randomEl.name} is ${randomEl.electronegativity ?? 'N/A (noble gas)'}.`,
            category: 'Electronegativity Scale',
          });
        } else if (qType === 'ionization') {
          const options = [
            `${randomEl.name} (${randomEl.ionizationEnergy ? `${randomEl.ionizationEnergy} kJ/mol` : 'Unknown'})`,
            ...distractors.map((d) => `${d.name} (${d.ionizationEnergy ? `${d.ionizationEnergy} kJ/mol` : 'Unknown'})`),
          ].sort(() => 0.5 - Math.random());
          const correctOpt = `${randomEl.name} (${randomEl.ionizationEnergy ? `${randomEl.ionizationEnergy} kJ/mol` : 'Unknown'})`;
          generated.push({
            id: `adv-ie-${Date.now()}-${i}`,
            question: `Identify the first ionization energy value for ${randomEl.name} (Z = ${randomEl.atomicNumber}):`,
            options,
            correctIndex: options.indexOf(correctOpt),
            explanation: `${randomEl.name} has a 1st ionization energy of ${randomEl.ionizationEnergy ?? 'N/A'} kJ/mol reflecting its effective nuclear charge and radius.`,
            category: 'Ionization Enthalpy',
          });
        } else {
          const options = [
            `Z=${randomEl.atomicNumber} (${randomEl.name})`,
            ...distractors.map((d) => `Z=${d.atomicNumber} (${d.name})`),
          ].sort(() => 0.5 - Math.random());
          generated.push({
            id: `adv-num-${Date.now()}-${i}`,
            question: `Which chemical element belongs to the "${randomEl.category.replace('-', ' ')}" family with Bohr shells [${randomEl.bohrShells.join(', ')}]?`,
            options,
            correctIndex: options.indexOf(`Z=${randomEl.atomicNumber} (${randomEl.name})`),
            explanation: `Element Z=${randomEl.atomicNumber} (${randomEl.name}) has Bohr electron distribution [${randomEl.bohrShells.join(', ')}].`,
            category: 'Atomic Structure',
          });
        }
      } else {
        // High School (Grade 10, CBSE, ICSE)
        const qTypes = ['valency', 'family', 'mass', 'discovery'];
        const qType = qTypes[Math.floor(Math.random() * qTypes.length)];

        if (qType === 'valency') {
          const options = [randomEl.name, ...distractors.map((d) => d.name)].sort(() => 0.5 - Math.random());
          generated.push({
            id: `hs-val-${Date.now()}-${i}`,
            question: `Which element possesses ${randomEl.valenceElectrons} valence electrons and belongs to Period ${randomEl.period}?`,
            options,
            correctIndex: options.indexOf(randomEl.name),
            explanation: `${randomEl.name} (${randomEl.symbol}) has ${randomEl.valenceElectrons} valence electrons and resides in Period ${randomEl.period}.`,
            category: 'Valence & Periodicity',
          });
        } else {
          const options = [randomEl.name, ...distractors.map((d) => d.name)].sort(() => 0.5 - Math.random());
          generated.push({
            id: `hs-fam-${Date.now()}-${i}`,
            question: `Which element is classified as a "${randomEl.category.replace('-', ' ')}" with atomic mass approximately ${randomEl.atomicMass.toFixed(1)} u?`,
            options,
            correctIndex: options.indexOf(randomEl.name),
            explanation: `${randomEl.name} (${randomEl.symbol}) has atomic mass ${randomEl.atomicMass.toFixed(2)} u and belongs to the ${randomEl.category.replace('-', ' ')} series.`,
            category: 'Chemical Families',
          });
        }
      }
    });

    setQuestions(generated);
  }, [gradeLevel]);

  const handleGenerateQuiz = useCallback(async () => {
    setLoading(true);
    setQuizFinished(false);
    setCurrentQIdx(0);
    setScore(0);
    setStreakCount(0);
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

      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions);
        setAiProvider(data.provider || 'gemini');
        setArchetypeTag(data.archetype || '');
      } else {
        generateFallbackQuiz();
        setAiProvider('dynamic');
      }
    } catch {
      generateFallbackQuiz();
      setAiProvider('dynamic');
    } finally {
      setLoading(false);
    }
  }, [selectedTopic, gradeLevel, generateFallbackQuiz]);

  useEffect(() => {
    handleGenerateQuiz();
  }, [handleGenerateQuiz]);

  const handleRandomizeTopic = () => {
    const otherTopics = TOPICS.filter((t) => t !== selectedTopic);
    const randomTopic = otherTopics[Math.floor(Math.random() * otherTopics.length)];
    setSelectedTopic(randomTopic);
  };

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null || !questions[currentQIdx]) return;
    setSelectedOption(idx);

    const isCorrect = idx === questions[currentQIdx].correctIndex;
    if (isCorrect) {
      playSound('correct', soundEnabled);
      const nextStreak = streakCount + 1;
      setStreakCount(nextStreak);
      setScore((prev) => prev + 1);

      // Streak-based XP scaling
      const earnedXp = nextStreak >= 3 ? 35 : 20;
      addXp(earnedXp);
    } else {
      playSound('wrong', soundEnabled);
      setStreakCount(0);
    }
  };

  const handleNextQuestion = useCallback(() => {
    if (currentQIdx + 1 < questions.length) {
      setCurrentQIdx((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setQuizFinished(true);
      playSound('levelUp', soundEnabled);
      if (score >= Math.floor(questions.length * 0.8)) {
        unlockAchievement('quiz_master');
      }
    }
  }, [currentQIdx, questions.length, score, soundEnabled, unlockAchievement]);

  // Keyboard controls for answering (1-4, Enter to proceed)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (['1', '2', '3', '4'].includes(e.key) && selectedOption === null && !loading && !quizFinished) {
        const optIdx = parseInt(e.key, 10) - 1;
        if (questions[currentQIdx] && optIdx < questions[currentQIdx].options.length) {
          handleSelectOption(optIdx);
        }
      } else if ((e.key === 'Enter' || e.code === 'Space') && selectedOption !== null && !quizFinished) {
        e.preventDefault();
        handleNextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOption, loading, quizFinished, currentQIdx, questions, handleNextQuestion]);

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full px-2 sm:px-4">
      {/* TOP CONFIGURATION & CURRICULUM BAR */}
      <div className="bg-black/40 p-4 sm:p-5 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xl backdrop-blur-3xl saturate-200">
        {/* Topic Selector & Random Topic button */}
        <div className="flex items-center gap-2 flex-1">
          <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-xs font-bold text-white/60">Topic:</span>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="bg-black/20 text-purple-300 font-bold text-xs px-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-purple-400 cursor-pointer flex-1 sm:max-w-xs shadow-inner backdrop-blur-md"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t} className="bg-slate-900 text-white">
                {t}
              </option>
            ))}
          </select>
          <button
            onClick={handleRandomizeTopic}
            className="p-1.5 rounded-xl bg-black/20 hover:bg-white/10 border border-white/10 text-purple-400 hover:text-purple-300 transition-all cursor-pointer shrink-0 shadow-inner"
            title="Pick a random chemistry topic"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Curriculum Level Selector & Refresh */}
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-bold text-white/60">Level:</span>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
            className="bg-black/20 text-cyan-300 font-bold text-xs px-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer w-full sm:w-auto shadow-inner backdrop-blur-md"
          >
            {CURRICULA.map((c) => (
              <option key={c.value} value={c.value} className="bg-slate-900 text-white">
                {c.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateQuiz}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 disabled:opacity-50 transition-all cursor-pointer shrink-0 active:scale-95 border border-white/20"
            title="Generate completely new random questions"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Randomize
          </button>
        </div>
      </div>

      {/* AI ENGINE STATUS BADGE */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs">
        <div className="flex items-center gap-2">
          {aiProvider === 'nvidia-nim' ? (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1.5 shadow-inner">
              <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> NVIDIA NIM API (Llama 3.1 70B)
            </span>
          ) : aiProvider === 'gemini' ? (
            <span className="px-2.5 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30 text-[11px] font-bold flex items-center gap-1.5 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Powered by Gemini AI
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-black/20 text-white/70 border border-white/10 text-[11px] font-bold flex items-center gap-1.5 shadow-inner">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Dynamic Chemistry Engine
            </span>
          )}

          {archetypeTag && (
            <span className="hidden sm:inline text-[11px] text-white/50 italic">
              Angle: {archetypeTag}
            </span>
          )}
        </div>

        <span className="text-white/40 text-[11px] font-mono">
          Randomized Questions · Never Fixed
        </span>
      </div>

      {/* MAIN QUIZ CARD CONTAINER */}
      <div className="bg-black/40 rounded-3xl border border-white/10 p-5 sm:p-7 space-y-6 shadow-2xl backdrop-blur-3xl saturate-200">
        {loading ? (
          <div className="py-16 text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-purple-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-white">Generating Novel Chemistry Questions...</h4>
              <p className="text-xs text-white/50">
                Calling <span className="text-emerald-400 font-bold">NVIDIA NIM API</span> / Gemini AI with randomized topic hooks for <span className="text-purple-300 font-bold">{gradeLevel}</span>.
              </p>
            </div>
          </div>
        ) : quizFinished ? (
          /* COMPLETION SCORE SCREEN */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-5"
          >
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
              <Award className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">Quiz Completed!</h3>
              <p className="text-xs text-white/50">
                Topic: <strong className="text-white/80">{selectedTopic}</strong>
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 py-2">
              <div className="bg-black/30 px-5 py-3 rounded-2xl border border-white/10 shadow-inner">
                <span className="text-[10px] uppercase font-bold text-white/40 block">Final Score</span>
                <span className="text-2xl font-black text-purple-300 font-mono">
                  {score} / {questions.length}
                </span>
              </div>
              <div className="bg-black/30 px-5 py-3 rounded-2xl border border-white/10 shadow-inner">
                <span className="text-[10px] uppercase font-bold text-white/40 block">Accuracy</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {Math.round((score / questions.length) * 100)}%
                </span>
              </div>
            </div>

            <button
              onClick={handleGenerateQuiz}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-purple-600/30 transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95 border border-white/20"
            >
              <RefreshCw className="w-4 h-4" /> Next Random Questions
            </button>
          </motion.div>
        ) : questions.length > 0 ? (
          /* ACTIVE QUESTION VIEW */
          <div className="space-y-6">
            {/* Question Progress & Streak HUD */}
            <div className="flex items-center justify-between text-xs text-white/50 font-bold border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-purple-400">
                  Question {currentQIdx + 1} of {questions.length}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 text-white/70 font-semibold border border-white/10 shadow-inner">
                  {questions[currentQIdx].category || 'Chemistry'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {streakCount >= 2 && (
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 text-orange-400 font-black text-[11px] bg-orange-950/60 border border-orange-500/30 px-2 py-0.5 rounded-lg animate-pulse shadow-inner"
                  >
                    <Flame className="w-3.5 h-3.5" /> {streakCount}x Streak (+35 XP)
                  </motion.span>
                )}
                <span className="text-white/60 font-mono">
                  Score: <strong className="text-white">{score}</strong>
                </span>
              </div>
            </div>

            {/* Question Title */}
            <h3 className="text-base sm:text-lg font-black text-white leading-snug">
              {questions[currentQIdx].question}
            </h3>

            {/* 4 Multi-Choice Option Buttons */}
            <div className="grid grid-cols-1 gap-2.5">
              {questions[currentQIdx].options.map((opt, idx) => {
                const isCorrect = idx === questions[currentQIdx].correctIndex;
                const isSelected = selectedOption === idx;

                let cardStyle =
                  'bg-black/20 hover:bg-white/10 text-white/80 border-white/10 hover:border-white/20 shadow-inner';
                if (selectedOption !== null) {
                  if (isCorrect) {
                    cardStyle =
                      'bg-emerald-950/80 text-emerald-300 border-emerald-500 font-bold shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500';
                  } else if (isSelected) {
                    cardStyle = 'bg-rose-950/80 text-rose-300 border-rose-500 font-bold';
                  } else {
                    cardStyle = 'bg-black/10 text-white/30 border-white/5 opacity-50';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={selectedOption !== null}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full min-h-[50px] p-3.5 sm:p-4 rounded-2xl border text-xs text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] select-none backdrop-blur-md ${cardStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-black/30 border border-white/10 font-mono text-[11px] font-extrabold flex items-center justify-center text-white/60 shrink-0 shadow-inner">
                        {optionLetters[idx]}
                      </span>
                      <span className="font-medium text-[13px]">{opt}</span>
                    </div>

                    {selectedOption !== null && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {selectedOption !== null && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scientific Explanation & Next Button */}
            <AnimatePresence>
              {selectedOption !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 pt-1"
                >
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/10 text-xs text-white/70 leading-relaxed shadow-inner backdrop-blur-md">
                    <strong className="text-purple-400 flex items-center gap-1.5 font-bold mb-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Scientific Explanation:
                    </strong>
                    {questions[currentQIdx].explanation}
                  </div>

                  <button
                    onClick={handleNextQuestion}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 border border-white/20"
                  >
                    Next Question (Press Enter) <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : null}
      </div>
    </div>
  );
};
