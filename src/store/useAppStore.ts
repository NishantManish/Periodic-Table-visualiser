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
  Atom3DTab,
  PendingReactionSetup,
} from '../types';
import { ELEMENTS } from '../data/elementsData';

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_element', title: 'Element Explorer', description: 'Inspect your first element in detail.', icon: '🔬', unlocked: false },
  { id: 'molecule_creator', title: 'Molecular Architect', description: 'Inspect or analyze a 3D molecule.', icon: '🧪', unlocked: false },
  { id: 'reaction_sim', title: 'Lab Chemist', description: 'Simulate a chemical reaction.', icon: '💥', unlocked: false },
  { id: 'ai_convo', title: 'AI Student', description: 'Ask the AI tutor a question.', icon: '🤖', unlocked: false },
  { id: 'streak_3', title: 'Dedicated Learner', description: 'Maintain a 3-day learning streak.', icon: '🔥', unlocked: false },
];

interface AppState {
  // Navigation & View
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Selected Element & Modal Visibility
  selectedElement: ElementData | null;
  isElementModalOpen: boolean;
  setSelectedElement: (element: ElementData | null) => void;

  // Cross-Laboratory Deep-Linking State
  activeMoleculeId: string | null;
  setActiveMoleculeId: (id: string | null) => void;
  atom3DTab: Atom3DTab;
  setAtom3DTab: (tab: Atom3DTab) => void;
  pendingReactionSetup: PendingReactionSetup | null;
  setPendingReactionSetup: (setup: PendingReactionSetup | null) => void;

  openElementInAtom3D: (element: ElementData, tab?: Atom3DTab) => void;
  openMoleculeInVisualizer: (moleculeId: string) => void;
  launchReactionSimulation: (setup: PendingReactionSetup) => void;

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
  notes: Record<number, string>; // atomic number -> note text
  masteredFlashcards: string[];
  achievements: Achievement[];

  addXp: (amount: number) => void;
  toggleBookmark: (atomicNumber: number) => void;
  saveNote: (atomicNumber: number, note: string) => void;
  unlockAchievement: (id: string) => void;
  importProgressBackup: (backup: {
    xp?: number;
    level?: number;
    streak?: number;
    lastStudyDate?: string;
    bookmarks?: number[];
    notes?: Record<number, string>;
    achievements?: Achievement[];
    gradeLevel?: GradeLevel;
    masteredFlashcards?: string[];
  }) => void;

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
        const raw = mode as string;
        const normalized: ViewMode =
          raw === 'molecule-builder'
            ? 'molecule-visualizer'
            : raw === 'atom-3d'
              ? '3d-atom'
              : raw === 'reactions'
                ? 'reaction-simulator'
                : raw === 'quiz'
                  ? 'table'
                  : mode;
        set({ viewMode: normalized });
      },

      // Element & Modal
      selectedElement: null,
      isElementModalOpen: false,
      setSelectedElement: (element) => {
        if (element) {
          get().unlockAchievement('first_element');
        }
        set({ selectedElement: element, isElementModalOpen: element !== null });
      },

      // Cross-Laboratory Deep-Linking
      activeMoleculeId: null,
      setActiveMoleculeId: (id) => set({ activeMoleculeId: id }),

      atom3DTab: 'bohr',
      setAtom3DTab: (tab) => set({ atom3DTab: tab }),

      pendingReactionSetup: null,
      setPendingReactionSetup: (setup) => set({ pendingReactionSetup: setup }),

      openElementInAtom3D: (element, tab = 'bohr') => {
        get().unlockAchievement('first_element');
        set({
          selectedElement: element,
          isElementModalOpen: false,
          atom3DTab: tab,
          viewMode: '3d-atom',
        });
      },

      openMoleculeInVisualizer: (moleculeId) => {
        get().unlockAchievement('molecule_creator');
        set({
          activeMoleculeId: moleculeId,
          selectedElement: null,
          isElementModalOpen: false,
          viewMode: 'molecule-visualizer',
        });
      },

      launchReactionSimulation: (setup) => {
        get().unlockAchievement('reaction_sim');
        set({
          pendingReactionSetup: setup,
          isElementModalOpen: false,
          viewMode: 'reaction-simulator',
        });
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
      notes: {
        1: 'Hydrogen is the fuel of the stars! Stars fuse 4 H atoms into 1 He atom.',
        6: 'Carbon has 4 valence electrons allowing complex 3D organic scaffolds.',
      },
      masteredFlashcards: [],
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

      importProgressBackup: (backup) => {
        const validBookmarks = Array.isArray(backup.bookmarks)
          ? backup.bookmarks.filter((n) => typeof n === 'number' && n >= 1 && n <= 118)
          : get().bookmarks;
        const validNotes: Record<number, string> = {};
        if (backup.notes && typeof backup.notes === 'object') {
          Object.entries(backup.notes).forEach(([k, v]) => {
            const z = Number(k);
            if (Number.isInteger(z) && z >= 1 && z <= 118 && typeof v === 'string') {
              validNotes[z] = v;
            }
          });
        } else {
          Object.assign(validNotes, get().notes);
        }

        const importedAchievements = Array.isArray(backup.achievements) ? backup.achievements : [];
        const reconciledAchievements = INITIAL_ACHIEVEMENTS.map((base) => {
          const match = importedAchievements.find((a) => a.id === base.id);
          return match ? { ...base, unlocked: Boolean(match.unlocked), unlockedAt: match.unlockedAt } : base;
        });

        const nextXp = typeof backup.xp === 'number' && backup.xp >= 0 ? Math.floor(backup.xp) : get().xp;
        const nextLevel = Math.floor(nextXp / 200) + 1;

        const ALLOWED_GRADE_LEVELS: GradeLevel[] = [
          'Grade 5',
          'Grade 8',
          'Grade 10',
          'CBSE/ICSE',
          'JEE/NEET',
          'University',
        ];
        const validGradeLevel =
          typeof backup.gradeLevel === 'string' &&
          ALLOWED_GRADE_LEVELS.includes(backup.gradeLevel as GradeLevel)
            ? (backup.gradeLevel as GradeLevel)
            : get().gradeLevel;

        set({
          xp: nextXp,
          level: typeof backup.level === 'number' && backup.level >= 1 ? backup.level : nextLevel,
          streak: typeof backup.streak === 'number' && backup.streak >= 0 ? backup.streak : get().streak,
          lastStudyDate: typeof backup.lastStudyDate === 'string' ? backup.lastStudyDate : get().lastStudyDate,
          bookmarks: validBookmarks,
          notes: validNotes,
          masteredFlashcards: Array.isArray(backup.masteredFlashcards)
            ? backup.masteredFlashcards.filter((s) => typeof s === 'string')
            : get().masteredFlashcards,
          achievements: reconciledAchievements,
          gradeLevel: validGradeLevel,
        });
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
        notes: state.notes,
        masteredFlashcards: state.masteredFlashcards,
        achievements: state.achievements,
        gradeLevel: state.gradeLevel,
        soundEnabled: state.soundEnabled,
        theme: state.theme,
        highContrast: state.highContrast,
        reducedMotion: state.reducedMotion,
        fontSizeScale: state.fontSizeScale,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<AppState> | undefined) ?? {};
        const persistedAchievements = Array.isArray(persisted.achievements)
          ? persisted.achievements
          : [];
        const reconciledAchievements = INITIAL_ACHIEVEMENTS.map((base) => {
          const existing = persistedAchievements.find((a) => a.id === base.id);
          return existing ? { ...base, unlocked: existing.unlocked, unlockedAt: existing.unlockedAt } : base;
        });
        return {
          ...currentState,
          ...persisted,
          achievements: reconciledAchievements,
        };
      },
    }
  )
);
