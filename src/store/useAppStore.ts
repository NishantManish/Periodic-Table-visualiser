import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ElementData,
  ElementCategory,
  PhysicalState,
  ElementBlock,
  HeatmapProperty,
  GradeLevel,
  ViewMode,
  Achievement,
} from '../types';
import { ELEMENTS } from '../data/elementsData';
import { playSound } from '../utils/audio';

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_element', title: 'Element Explorer', description: 'Inspect your first element in detail.', icon: '🔬', unlocked: false },
  { id: 'quiz_master', title: 'Chemistry Scholar', description: 'Complete a quiz with a score of 80% or higher.', icon: '🎓', unlocked: false },
  { id: 'flashcard_master', title: 'Flashcard Pro', description: 'Master 10 element flashcards.', icon: '🃏', unlocked: false },
  { id: 'element_detective', title: 'Element Detective', description: 'Guess a mystery element in Guess The Element mode.', icon: '🕵️‍♂️', unlocked: false },
  { id: 'electron_master', title: 'Orbital Architect', description: 'Master electron configuration challenges.', icon: '⚛️', unlocked: false },
  { id: 'reaction_master', title: 'Reaction Predictor', description: 'Predict chemical reactions correctly.', icon: '🧪', unlocked: false },
  { id: 'speed_demon', title: 'Blitz Chemist', description: 'Score 5+ correct answers in Timed Blitz Mode.', icon: '⚡', unlocked: false },
  { id: 'molecule_creator', title: 'Molecular Architect', description: 'Build or inspect a 3D molecule.', icon: '🧪', unlocked: false },
  { id: 'reaction_sim', title: 'Lab Chemist', description: 'Simulate a chemical reaction.', icon: '💥', unlocked: false },
  { id: 'ai_convo', title: 'AI Student', description: 'Ask the AI tutor a question.', icon: '🤖', unlocked: false },
  { id: 'streak_3', title: 'Dedicated Learner', description: 'Maintain a 3-day learning streak.', icon: '🔥', unlocked: false },
];

interface AppState {
  // Navigation & View
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Selected Element
  selectedElement: ElementData | null;
  setSelectedElement: (element: ElementData | null) => void;

  // Search & Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  categoryFilter: ElementCategory | 'all';
  setCategoryFilter: (cat: ElementCategory | 'all') => void;

  stateFilter: PhysicalState | 'all';
  setStateFilter: (st: PhysicalState | 'all') => void;

  blockFilter: ElementBlock | 'all';
  setBlockFilter: (block: ElementBlock | 'all') => void;

  groupFilter: number | 'all';
  setGroupFilter: (group: number | 'all') => void;

  periodFilter: number | 'all';
  setPeriodFilter: (period: number | 'all') => void;

  resetFilters: () => void;

  heatmapProperty: HeatmapProperty;
  setHeatmapProperty: (prop: HeatmapProperty) => void;

  // Learning Level
  gradeLevel: GradeLevel;
  setGradeLevel: (level: GradeLevel) => void;

  // User Stats & Progress
  xp: number;
  level: number;
  streak: number;
  lastStudyDate: string;
  bookmarks: number[]; // atomic numbers
  masteredFlashcards: number[]; // atomic numbers
  reviewFlashcards: number[]; // atomic numbers
  notes: Record<number, string>; // atomic number -> note text
  achievements: Achievement[];
  
  addXp: (amount: number) => void;
  toggleBookmark: (atomicNumber: number) => void;
  markFlashcardMastered: (atomicNumber: number) => void;
  markFlashcardReview: (atomicNumber: number) => void;
  saveNote: (atomicNumber: number, note: string) => void;
  unlockAchievement: (id: string) => void;

  // Settings & Accessibility
  soundEnabled: boolean;
  toggleSound: () => void;

  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;

  highContrast: boolean;
  toggleHighContrast: () => void;

  reducedMotion: boolean;
  toggleReducedMotion: () => void;

  fontSizeScale: 'normal' | 'large' | 'xlarge';
  setFontSizeScale: (scale: 'normal' | 'large' | 'xlarge') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Default view
      viewMode: 'table',
      setViewMode: (mode) => {
        const normalized = mode === 'molecule-builder' ? 'molecule-visualizer' : mode;
        set({ viewMode: normalized });
      },

      // Element
      selectedElement: null,
      setSelectedElement: (element) => {
        if (element) {
          get().unlockAchievement('first_element');
        }
        set({ selectedElement: element });
      },

      // Filters
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      categoryFilter: 'all',
      setCategoryFilter: (cat) => set({ categoryFilter: cat }),

      stateFilter: 'all',
      setStateFilter: (st) => set({ stateFilter: st }),

      blockFilter: 'all',
      setBlockFilter: (block) => set({ blockFilter: block }),

      groupFilter: 'all',
      setGroupFilter: (group) => set({ groupFilter: group }),

      periodFilter: 'all',
      setPeriodFilter: (period) => set({ periodFilter: period }),

      resetFilters: () =>
        set({
          searchQuery: '',
          categoryFilter: 'all',
          stateFilter: 'all',
          blockFilter: 'all',
          groupFilter: 'all',
          periodFilter: 'all',
        }),

      heatmapProperty: 'none',
      setHeatmapProperty: (prop) => set({ heatmapProperty: prop }),

      // Grade Level
      gradeLevel: 'Grade 10',
      setGradeLevel: (level) => {
        set({ gradeLevel: level });
      },

      // Progress
      xp: 120,
      level: 1,
      streak: 1,
      lastStudyDate: new Date().toISOString().slice(0, 10),
      bookmarks: [1, 6, 8, 79], // H, C, O, Au bookmarked by default
      masteredFlashcards: [],
      reviewFlashcards: [],
      notes: {
        1: 'Hydrogen is the fuel of the stars! Stars fuse 4 H atoms into 1 He atom.',
        6: 'Carbon has 4 valence electrons allowing complex 3D organic scaffolds.',
      },
      achievements: INITIAL_ACHIEVEMENTS,

      addXp: (amount) => {
        const today = new Date().toISOString().slice(0, 10);
        const prevDate = get().lastStudyDate;
        let nextStreak = get().streak;
        if (prevDate !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          nextStreak = prevDate === yesterday ? nextStreak + 1 : 1;
        }
        const newXp = get().xp + amount;
        const newLevel = Math.floor(newXp / 200) + 1;
        set({ xp: newXp, level: newLevel, streak: nextStreak, lastStudyDate: today });
        if (nextStreak >= 3) {
          get().unlockAchievement('streak_3');
        }
      },

      toggleBookmark: (atomicNumber) => {
        const current = get().bookmarks;
        if (current.includes(atomicNumber)) {
          set({ bookmarks: current.filter((id) => id !== atomicNumber) });
        } else {
          set({ bookmarks: [...current, atomicNumber] });
        }
      },

      markFlashcardMastered: (atomicNumber) => {
        const currentMastered = get().masteredFlashcards;
        const currentReview = get().reviewFlashcards.filter((id) => id !== atomicNumber);
        if (!currentMastered.includes(atomicNumber)) {
          const nextMastered = [...currentMastered, atomicNumber];
          set({ masteredFlashcards: nextMastered, reviewFlashcards: currentReview });
          get().addXp(15);
          if (nextMastered.length >= 10) {
            get().unlockAchievement('flashcard_master');
          }
        } else {
          set({ reviewFlashcards: currentReview });
        }
      },

      markFlashcardReview: (atomicNumber) => {
        const currentMastered = get().masteredFlashcards.filter((id) => id !== atomicNumber);
        const currentReview = get().reviewFlashcards;
        const nextReview = currentReview.includes(atomicNumber)
          ? currentReview
          : [...currentReview, atomicNumber];
        set({ masteredFlashcards: currentMastered, reviewFlashcards: nextReview });
      },

      saveNote: (atomicNumber, note) => {
        set({
          notes: {
            ...get().notes,
            [atomicNumber]: note,
          },
        });
      },

      unlockAchievement: (id) => {
        const list = get().achievements;
        const found = list.find((a) => a.id === id);
        if (found && !found.unlocked) {
          set({
            achievements: list.map((a) =>
              a.id === id ? { ...a, unlocked: true, unlockedAt: new Date().toLocaleDateString() } : a
            ),
          });
        }
      },

      // Settings
      soundEnabled: false,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

      theme: 'dark',
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'dark' ? 'light' : 'dark';
          return { theme: next };
        }),

      highContrast: false,
      toggleHighContrast: () =>
        set((state) => ({ highContrast: !state.highContrast })),

      reducedMotion: false,
      toggleReducedMotion: () =>
        set((state) => ({ reducedMotion: !state.reducedMotion })),

      fontSizeScale: 'normal',
      setFontSizeScale: (scale) => set({ fontSizeScale: scale }),
    }),
    {
      name: 'periodic-table-explorer-storage',
      partialize: (state) => ({
        xp: state.xp,
        level: state.level,
        streak: state.streak,
        lastStudyDate: state.lastStudyDate,
        bookmarks: state.bookmarks,
        masteredFlashcards: state.masteredFlashcards,
        reviewFlashcards: state.reviewFlashcards,
        notes: state.notes,
        achievements: state.achievements,
        gradeLevel: state.gradeLevel,
        soundEnabled: state.soundEnabled,
        theme: state.theme,
        highContrast: state.highContrast,
        reducedMotion: state.reducedMotion,
        fontSizeScale: state.fontSizeScale,
      }),
    }
  )
);
