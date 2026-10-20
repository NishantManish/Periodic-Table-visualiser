import React, { Suspense, lazy } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Header } from '@/components/Header';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ToastProvider } from '@/components/ui';
import { Loader2 } from 'lucide-react';

const PeriodicGrid = lazy(() => import('@/components/PeriodicTable/PeriodicGrid').then(m => ({ default: m.PeriodicGrid })));
const AtomViewer3D = lazy(() => import('@/components/Atom3D/AtomViewer3D').then(m => ({ default: m.AtomViewer3D })));
const MoleculeBuilder = lazy(() => import('@/components/MoleculeBuilder/MoleculeBuilder').then(m => ({ default: m.MoleculeBuilder })));
const ReactionSimulator = lazy(() => import('@/components/ReactionSimulator/ReactionSimulator').then(m => ({ default: m.ReactionSimulator })));
const PeriodicTrends = lazy(() => import('@/components/PeriodicTrends/PeriodicTrends').then(m => ({ default: m.PeriodicTrends })));
const LearningDashboard = lazy(() => import('@/components/LearningDashboard/LearningDashboard').then(m => ({ default: m.LearningDashboard })));
const QuizMode = lazy(() => import('@/components/QuizMode/QuizMode').then(m => ({ default: m.QuizMode })));
const AiTutorView = lazy(() => import('@/components/AiTutor/AiTutorView').then(m => ({ default: m.AiTutorView })));
const ElementDetailModal = lazy(() => import('@/components/ElementModal/ElementDetailModal').then(m => ({ default: m.ElementDetailModal })));

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-slate-900 rounded-2xl border border-slate-800">
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-400 mb-4">An error occurred while loading this view.</p>
          <button onClick={() => this.setState({ hasError: false })} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold">Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SuspenseLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
  </div>
);

export default function App() {
  const { viewMode, selectedElement, theme, highContrast } = useAppStore();

  return (
    <QueryProvider>
      <ThemeProvider>
        <ToastProvider>
          <div
            className={`min-h-screen font-sans transition-colors relative ${
              theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-100'
            } ${highContrast ? 'contrast-125' : ''}`}
          >
            {/* Background Ambient Glow Effects */}
            <div className="ambient-glow-bg" />

            {/* Content Wrapper */}
            <div className="relative z-10">
              {/* Global Header Navigation */}
              <Header />

              {/* Main View Container Optimized for PC / Widescreen Displays */}
              <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5">
                <ErrorBoundary>
                  <Suspense fallback={<SuspenseLoader />}>
                    {viewMode === 'table' && <PeriodicGrid />}
                    {viewMode === '3d-atom' && <AtomViewer3D />}
                    {viewMode === 'molecule-builder' && <MoleculeBuilder />}
                    {viewMode === 'reaction-simulator' && <ReactionSimulator />}
                    {viewMode === 'trends' && <PeriodicTrends />}
                    {viewMode === 'learning' && <LearningDashboard />}
                    {viewMode === 'quiz' && <QuizMode />}
                    {viewMode === 'ai-tutor' && <AiTutorView />}
                  </Suspense>
                </ErrorBoundary>
              </main>
            </div>

            {/* Element Inspector Modal */}
            <Suspense fallback={null}>
              {selectedElement && <ElementDetailModal />}
            </Suspense>
          </div>
        </ToastProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}


